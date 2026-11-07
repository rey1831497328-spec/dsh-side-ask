// dsh-side-ask — host half
// 旁问：在旁路里就当前上下文提问，答案不进主会话、不落主会话日志、不调用任何工具。

const name = "dsh-side-ask";
const inject = ["commands", "subagents", "tools"];

const COMMAND_ASK = "sideask";
const COMMAND_RUN = "sideask-run";
const COMMAND_CLOSE = "sideask-close";

const MAX_QUESTION_LENGTH = 8000;
const MAX_OUTPUT_TOKENS = 32000;
const DEFAULT_TIMEOUT_MS = 300000;
const MAX_CONCURRENT = 4;
const ID_PATTERN = /^[a-zA-Z0-9-]{8,80}$/;

const TEXT = {
  duplicate: "这个旁问请求已经在进行中。",
  capacity: "同时进行的旁问太多了，先关掉几个。",
  cancelled: "旁问已取消。",
  timeout: "旁问超时。",
  empty: "先写一个要问的问题。",
  tooLong: "问题太长（上限 " + MAX_QUESTION_LENGTH + " 字符）。",
  badRequest: "旁问请求格式不对。",
  badId: "旁问请求标识不合法。",
  stopped: "旁问已停止。",
  noAnswer: "旁问没有返回内容。",
  noProvider: "当前 DSH 不支持 fork 子代理，旁问需要继承主会话上下文。",
  noSession: "找不到主会话，无法旁问。",
  failed: "旁问失败。",
};

const DENY =
  "旁问只允许纯文字回答：任何工具调用都会被拒绝，请直接给出文字答案。" +
  " Side ask is text-only; every tool call is rejected.";

const PROMPT_PREFIX = `你在用户主对话的"旁路"里回答一个即时问题。

规则：
1. 只依据当前已经加载的上下文回答。不要调用任何工具——工具调用会被拒绝并中断这次回答。
2. 直接给答案。不要复述这些规则，不要写"好的，我来解释"之类的开场。
3. 上下文里没有足够信息就直说没有，并指出还缺什么。不要编造。
4. 默认简短：一两句能说清就不要展开；确实需要再用短列表，不要写成文章。

用户的问题：`;

function messageOf(error) {
  if (error instanceof Error) return error.message;
  return error === undefined || error === null ? "" : String(error);
}

function failure(text) {
  return { kind: "error", text };
}

function collectText(response) {
  const blocks = Array.isArray(response && response.output) ? response.output : [];
  return blocks
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/<function_call>[\s\S]*?<\/function_call>/gi, "")
    .replace(/```(?:tool_call|function_call)[\s\S]*?```/gi, "")
    .trim();
}

function parseRequest(raw) {
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(TEXT.badRequest);
  }
  if (typeof value !== "object" || value === null) throw new Error(TEXT.badRequest);
  const id = value.id;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) throw new Error(TEXT.badId);
  const question = value.question;
  if (typeof question !== "string" || question.trim() === "") throw new Error(TEXT.empty);
  if (question.length > MAX_QUESTION_LENGTH) throw new Error(TEXT.tooLong);
  return { id, question: question.trim() };
}

function scopeOf(invocation) {
  const id = invocation && invocation.agent && invocation.agent.session && invocation.agent.session.header && invocation.agent.session.header.id;
  return typeof id === "string" ? id : "unknown";
}

class SideJobs {
  constructor(start, timeoutMs) {
    this.start = start;
    this.timeoutMs = typeof timeoutMs === "number" ? timeoutMs : DEFAULT_TIMEOUT_MS;
    this.jobs = new Map();
    this.disposed = false;
  }

  ask(scope, id, question, signal, parent) {
    const key = scope + "\u0000" + id;
    if (this.disposed) return Promise.resolve(failure(TEXT.stopped));
    if (this.jobs.has(key)) return Promise.resolve(failure(TEXT.duplicate));
    if (this.jobs.size >= MAX_CONCURRENT) return Promise.resolve(failure(TEXT.capacity));

    const controller = new AbortController();
    const job = { key, controller, run: void 0 };
    this.jobs.set(key, job);

    const cancel = () => controller.abort(new Error(TEXT.cancelled));
    if (signal) {
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) cancel();
    }
    const timer = this.timeoutMs > 0 ? setTimeout(() => controller.abort(new Error(TEXT.timeout)), this.timeoutMs) : void 0;
    if (timer && typeof timer.unref === "function") timer.unref();

    job.promise = this.execute(job, question, controller.signal, parent).finally(() => {
      if (timer) clearTimeout(timer);
      if (signal) signal.removeEventListener("abort", cancel);
      this.jobs.delete(key);
    });
    return job.promise;
  }

  async close(scope, id) {
    const job = this.jobs.get(scope + "\u0000" + id);
    if (!job) return { kind: "success", text: "" };
    job.controller.abort(new Error(TEXT.cancelled));
    await this.cleanup(job);
    return { kind: "success", text: "" };
  }

  async execute(job, question, signal, parent) {
    try {
      signal.throwIfAborted();
      const run = await this.start(question, signal, parent);
      job.run = run;
      Promise.resolve(run.result).catch(() => void 0);
      const response = await run.result;
      signal.throwIfAborted();
      const text = collectText(response);
      return text === "" ? failure(TEXT.noAnswer) : { kind: "success", text };
    } catch (error) {
      return failure(messageOf(error) || TEXT.failed);
    } finally {
      await this.cleanup(job);
    }
  }

  async cleanup(job) {
    const run = job.run;
    job.run = void 0;
    if (!run) return;
    try {
      await run.dispose();
    } catch {
      // 子会话已经结束或不可释放，忽略：旁问是一次性的。
    }
  }

  async dispose() {
    this.disposed = true;
    const jobs = [...this.jobs.values()];
    this.jobs.clear();
    await Promise.all(
      jobs.map(async (job) => {
        try {
          job.controller.abort(new Error(TEXT.stopped));
          await this.cleanup(job);
        } catch {
          // ignore
        }
      })
    );
  }
}

function apply(ctx) {
  const owned = new WeakSet();
  const ownedIds = new Set();
  const children = new Map();

  const guard = (call) => {
    const agent = call && call.agent;
    if (!agent) return void 0;
    if (owned.has(agent)) return DENY;
    const header = agent.session && agent.session.header;
    if (header && typeof header.id === "string" && ownedIds.has(header.id)) return DENY;
    return void 0;
  };

  const releasePluginGuard = ctx.tools && typeof ctx.tools.guard === "function" ? ctx.tools.guard(guard) : void 0;

  const stopCreated = ctx.on("agent/created", (payload) => {
    const agent = payload && payload.agent ? payload.agent : payload;
    const id = agent && agent.id;
    if (typeof id !== "string") return;
    const entry = children.get(id);
    if (!entry) return;
    children.delete(id);
    owned.add(agent);
    if (agent.session && typeof agent.session === "object") owned.add(agent.session);
    if (entry.current) entry.current(agent);
  });

  const start = async (question, signal, parent) => {
    const provider = ctx.subagents.getProvider("fork");
    if (!provider || !provider.inheritsParentContext) throw new Error(TEXT.noProvider);
    if (!parent) throw new Error(TEXT.noSession);

    const childId = globalThis.crypto.randomUUID();
    const entry = { current: void 0 };
    const released = { release: void 0 };
    // agent/created 可能在 startActivation 返回之前触发，所以先把钩子装好。
    entry.current = (agent) => {
      try {
        if (agent.ctx && agent.ctx.tools && typeof agent.ctx.tools.guard === "function") {
          released.release = agent.ctx.tools.guard(guard);
        }
      } catch {
        released.release = void 0;
      }
    };
    children.set(childId, entry);
    ownedIds.add(childId);
    try {
      const parentMax = parent.options ? parent.options.maxTokens : void 0;
      const maxTokens = typeof parentMax === "number" && parentMax > 0 ? Math.min(MAX_OUTPUT_TOKENS, parentMax) : MAX_OUTPUT_TOKENS;
      const activation = await ctx.subagents.startActivation({
        provider: "fork",
        label: "旁问",
        childId,
        request: {
          parent,
          agentOptions: { maxTokens },
          prompt: [{ type: "text", text: PROMPT_PREFIX + "\n" + question }],
        },
        signal,
        delivery: "caller",
      });
      return {
        result: activation.result,
        dispose: async () => {
          try {
            await activation.dispose();
          } finally {
            children.delete(childId);
            ownedIds.delete(childId);
            const releaseChild = released.release;
            released.release = void 0;
            if (typeof releaseChild === "function") {
              try {
                await releaseChild();
              } catch {
                // ignore
              }
            }
          }
        },
      };
    } catch (error) {
      children.delete(childId);
      ownedIds.delete(childId);
      throw error;
    }
  };

  const jobs = new SideJobs(start, DEFAULT_TIMEOUT_MS);
  ctx.effect(() => () => jobs.dispose());
  ctx.effect(() => () => {
    stopCreated();
    if (typeof releasePluginGuard === "function") return releasePluginGuard();
    return void 0;
  });

  ctx.effect(() =>
    ctx.commands.register({
      name: COMMAND_ASK,
      description: "旁问：基于当前对话回答，问答不写入上下文",
      recordInput: false,
      input: { hint: "要问的问题" },
      handler: (invocation) => {
        const question = String(invocation.rawInput || "").trim();
        if (question === "") return failure(TEXT.empty);
        if (question.length > MAX_QUESTION_LENGTH) return failure(TEXT.tooLong);
        const id = globalThis.crypto.randomUUID();
        return jobs.ask(scopeOf(invocation), id, question, invocation.signal, invocation.agent);
      },
    })
  );

  ctx.effect(() =>
    ctx.commands.register({
      name: COMMAND_RUN,
      description: "旁问（内部）",
      recordInput: false,
      handler: (invocation) => {
        let request;
        try {
          request = parseRequest(String(invocation.rawInput || ""));
        } catch (error) {
          return failure(messageOf(error));
        }
        return jobs.ask(scopeOf(invocation), request.id, request.question, invocation.signal, invocation.agent);
      },
    })
  );

  ctx.effect(() =>
    ctx.commands.register({
      name: COMMAND_CLOSE,
      description: "关闭旁问（内部）",
      recordInput: false,
      handler: (invocation) => {
        const id = String(invocation.rawInput || "").trim();
        if (!ID_PATTERN.test(id)) return failure(TEXT.badId);
        return jobs.close(scopeOf(invocation), id);
      },
    })
  );
}

export { apply, inject, name };
