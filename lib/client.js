window.__ModuleLoader__.load({id:"dsh-side-ask",factory:(require)=>{
"use strict";
const React = require("react");
const module = { exports: {} };
const exports = module.exports;
const h = React.createElement;

const NS = "sideask";
const ASK_COMMAND = "sideask-run";
const CLOSE_COMMAND = "sideask-close";
const MAX_QUESTION_LENGTH = 8000;

const zh = {
  "locale.id": "zh",
  "button.idle": "\u65C1\u95EE",
  "button.open": "\u6536\u8D77\u65C1\u95EE",
  "button.close": "\u5173\u95ED\u65C1\u95EE",
  "button.title": "\u5C31\u5F53\u524D\u5BF9\u8BDD\u95EE\u4E00\u4E2A\u95EE\u9898\uFF0C\u4E0D\u8BA1\u5165\u4E0A\u4E0B\u6587",
  "panel.title": "\u65C1\u95EE",
  "panel.badge": "\u4E0D\u8BA1\u5165\u4E0A\u4E0B\u6587",
  "panel.hint": "\u5C31\u5F53\u524D\u5BF9\u8BDD\u63D0\u95EE\uFF0C\u56DE\u7B54\u53EA\u5728\u8FD9\u91CC\uFF1B\u63D0\u51FA\u65B0\u95EE\u9898\u4F1A\u6E05\u9664\u4E0A\u4E00\u4E2A\u95EE\u7B54\u3002",
  "panel.placeholder": "\u4F8B\u5982\uFF1A\u8FD9\u91CC\u7684\u300Ctokens \u8BA1\u8D39\u300D\u5177\u4F53\u6307\u4EC0\u4E48\uFF1F",
  "panel.send": "\u63D0\u95EE",
  "panel.sending": "\u6B63\u5728\u56DE\u7B54\u2026",
  "panel.stop": "\u505C\u6B62",
  "panel.copy": "\u590D\u5236",
  "panel.copied": "\u5DF2\u590D\u5236",
  "panel.empty": "\u5148\u5199\u4E00\u4E2A\u8981\u95EE\u7684\u95EE\u9898\u3002",
  "panel.tooLong": "\u95EE\u9898\u592A\u957F\uFF08\u4E0A\u9650 8000 \u5B57\u7B26\uFF09\u3002",
  "panel.noAnswer": "\uFF08\u6CA1\u6709\u8FD4\u56DE\u5185\u5BB9\uFF09",
  "panel.busy": "\u4E3B\u5BF9\u8BDD\u6B63\u5728\u56DE\u590D\u4E2D\uFF0C\u7B49\u8FD9\u4E00\u8F6E\u7ED3\u675F\u540E\u518D\u95EE\u3002",
  "panel.subagent": "\u5B50\u4F1A\u8BDD\u91CC\u4E0D\u80FD\u65C1\u95EE\u3002",
  "panel.failed": "\u65C1\u95EE\u5931\u8D25\uFF1A",
  "panel.questionLabel": "\u95EE",
  "panel.answerLabel": "\u7B54",
  "panel.shortcut": "Enter \u63D0\u95EE \xB7 Shift+Enter \u6362\u884C"
};
const en = {
  "locale.id": "en",
  "button.idle": "Side ask",
  "button.open": "Hide side ask",
  "button.close": "Close side ask",
  "button.title": "Ask about the current conversation; the Q&A is not added to context",
  "panel.title": "Side ask",
  "panel.badge": "not in context",
  "panel.hint": "Answered from the current conversation. The Q&A stays here, and a new question replaces the previous one.",
  "panel.placeholder": "e.g. what exactly does \u201Ctoken billing\u201D mean here?",
  "panel.send": "Ask",
  "panel.sending": "Answering\u2026",
  "panel.stop": "Stop",
  "panel.copy": "Copy",
  "panel.copied": "Copied",
  "panel.empty": "Type a question first.",
  "panel.tooLong": "Question is too long (limit 8000 characters).",
  "panel.noAnswer": "(no content returned)",
  "panel.busy": "The main conversation is answering; ask again once this turn ends.",
  "panel.subagent": "Side ask is unavailable inside a subagent session.",
  "panel.failed": "Side ask failed: ",
  "panel.questionLabel": "Q",
  "panel.answerLabel": "A",
  "panel.shortcut": "Enter to ask \xB7 Shift+Enter for a new line"
};

function messageOf(error) {
  if (error instanceof Error) return error.message;
  return error === undefined || error === null ? "" : String(error);
}

function newId() {
  const cryptoObj = typeof globalThis !== "undefined" ? globalThis.crypto : void 0;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") return cryptoObj.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

const COLOR = {
  text: "var(--dsw-alias-label-primary, #1f2329)",
  muted: "var(--dsw-alias-label-secondary, #646a73)",
  border: "var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12))",
  borderSoft: "var(--dsw-alias-border-l3, rgba(0, 0, 0, 0.08))",
  layer: "var(--dsw-alias-bg-layer-2, #ffffff)",
  base: "var(--dsw-alias-bg-base, #ffffff)",
  hover: "var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.06))",
  accent: "var(--dsw-alias-state-business-primary, #3370ff)",
  error: "var(--dsw-alias-state-error-primary, #d83931)",
  code: "var(--dsw-alias-markdown-code-block, rgba(0, 0, 0, 0.04))"
};
const FONT_SM = "var(--dsw-font-xs-13, 13px)";

const S = {
  wrap: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "2px 0 6px",
    fontFamily: "inherit"
  },
  chipRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "8px"
  },
  chip: {
    appearance: "none",
    border: "1px solid " + COLOR.borderSoft,
    background: "transparent",
    color: COLOR.muted,
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: FONT_SM,
    lineHeight: "20px",
    cursor: "pointer"
  },
  chipActive: {
    appearance: "none",
    border: "1px solid " + COLOR.border,
    background: COLOR.hover,
    color: COLOR.text,
    borderRadius: "999px",
    padding: "2px 10px",
    fontSize: FONT_SM,
    lineHeight: "20px",
    cursor: "pointer"
  },
  card: {
    border: "1px solid " + COLOR.border,
    borderRadius: "12px",
    background: COLOR.layer,
    boxShadow: "var(--dsw-elevation-panel, 0 4px 16px rgba(0, 0, 0, 0.08))",
    padding: "10px 12px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    color: COLOR.text,
    fontSize: FONT_SM
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  title: {
    fontWeight: 600,
    fontSize: FONT_SM
  },
  badge: {
    fontSize: "11px",
    color: COLOR.muted,
    border: "1px solid " + COLOR.borderSoft,
    borderRadius: "999px",
    padding: "0 6px",
    lineHeight: "16px"
  },
  spacer: {
    flex: "1 1 auto"
  },
  iconButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: COLOR.muted,
    fontSize: "16px",
    lineHeight: "16px",
    cursor: "pointer",
    padding: "2px 4px",
    borderRadius: "6px"
  },
  hint: {
    fontSize: "11px",
    color: COLOR.muted,
    lineHeight: "16px"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    resize: "vertical",
    minHeight: "52px",
    maxHeight: "200px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid " + COLOR.border,
    background: COLOR.base,
    color: COLOR.text,
    fontSize: FONT_SM,
    lineHeight: "20px",
    fontFamily: "inherit",
    outline: "none"
  },
  footer: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  status: {
    fontSize: "11px",
    color: COLOR.muted
  },
  primary: {
    appearance: "none",
    border: "1px solid transparent",
    background: COLOR.accent,
    color: "#ffffff",
    borderRadius: "8px",
    padding: "4px 12px",
    fontSize: FONT_SM,
    lineHeight: "18px",
    cursor: "pointer"
  },
  secondary: {
    appearance: "none",
    border: "1px solid " + COLOR.border,
    background: "transparent",
    color: COLOR.text,
    borderRadius: "8px",
    padding: "4px 12px",
    fontSize: FONT_SM,
    lineHeight: "18px",
    cursor: "pointer"
  },
  qLine: {
    display: "flex",
    gap: "6px",
    alignItems: "baseline",
    color: COLOR.text
  },
  label: {
    fontSize: "11px",
    color: COLOR.muted,
    flex: "0 0 auto"
  },
  qText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: "20px"
  },
  error: {
    color: COLOR.error,
    fontSize: FONT_SM,
    lineHeight: "20px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word"
  },
  answerBox: {
    border: "1px solid " + COLOR.borderSoft,
    borderRadius: "8px",
    background: COLOR.base,
    padding: "8px 10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  answerHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  linkButton: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: COLOR.muted,
    fontSize: "11px",
    cursor: "pointer",
    padding: "0 2px"
  },
  answerBody: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: "21px",
    color: COLOR.text,
    maxHeight: "46vh",
    overflowY: "auto"
  }
};

function SideAskPanel(props) {
  const t = typeof props.t === "function" ? props.t : function (key) { return key; };
  const session = props.session;
  const sessionId = session && session.sessionId ? session.sessionId : "";
  const execute = props.execute;

  const [open, setOpen] = React.useState(false);
  const [question, setQuestion] = React.useState("");
  const [answer, setAnswer] = React.useState("");
  const [shownQuestion, setShownQuestion] = React.useState("");
  const [error, setError] = React.useState("");
  const [asking, setAsking] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const idRef = React.useRef("");
  const controllerRef = React.useRef(null);
  const askingRef = React.useRef(false);

  React.useEffect(function () {
    return function cleanup() {
      const controller = controllerRef.current;
      if (controller) controller.abort();
    };
  }, []);

  if (session && session.subagent) return null;
  if (!sessionId) return null;

  const markAsking = function (value) {
    askingRef.current = value;
    setAsking(value);
  };

  const submit = function () {
    if (askingRef.current) return;
    const text = String(question).trim();
    if (text === "") {
      setError(t("panel.empty"));
      return;
    }
    if (text.length > MAX_QUESTION_LENGTH) {
      setError(t("panel.tooLong"));
      return;
    }
    const id = newId();
    idRef.current = id;
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    controllerRef.current = controller;
    setAnswer("");
    setShownQuestion(text);
    setError("");
    setCopied(false);
    markAsking(true);
    const line = "/" + ASK_COMMAND + " " + JSON.stringify({ id: id, question: text });
    Promise.resolve()
      .then(function () {
        return execute(sessionId, line, controller ? controller.signal : void 0);
      })
      .then(function (result) {
        if (idRef.current !== id) return;
        markAsking(false);
        if (result && result.kind === "error") {
          setError(result.text || t("panel.failed"));
          return;
        }
        setAnswer(result && result.text ? result.text : t("panel.noAnswer"));
      })
      .catch(function (thrown) {
        if (idRef.current !== id) return;
        markAsking(false);
        setError(messageOf(thrown) || t("panel.failed"));
      });
  };

  const stop = function () {
    const id = idRef.current;
    const controller = controllerRef.current;
    if (controller) controller.abort();
    if (id) {
      const line = "/" + CLOSE_COMMAND + " " + id;
      Promise.resolve()
        .then(function () {
          return execute(sessionId, line, void 0);
        })
        .catch(function () {
          return void 0;
        });
    }
    idRef.current = "";
    markAsking(false);
  };

  const copy = function () {
    if (answer === "") return;
    const done = function () {
      setCopied(true);
      setTimeout(function () {
        setCopied(false);
      }, 1500);
    };
    const text = answer;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(done, function () {
          return void 0;
        });
        return;
      }
    } catch (ignored) {
      void ignored;
    }
    try {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
      done();
    } catch (ignored) {
      void ignored;
    }
  };

  const onKeyDown = function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    const composing = event.nativeEvent && event.nativeEvent.isComposing;
    if (event.key === "Enter" && !event.shiftKey && !composing) {
      event.preventDefault();
      submit();
    }
  };

  const header = h(
    "div",
    { style: S.header },
    h("span", { style: S.title }, t("panel.title")),
    h("span", { style: S.badge }, t("panel.badge")),
    h("div", { style: S.spacer }),
    h(
      "button",
      {
        type: "button",
        style: S.iconButton,
        title: t("button.close"),
        onClick: function () {
          setOpen(false);
        }
      },
      "\u00d7"
    )
  );

  const questionLine = shownQuestion
    ? h(
        "div",
        { style: S.qLine },
        h("span", { style: S.label }, t("panel.questionLabel")),
        h("span", { style: S.qText }, shownQuestion)
      )
    : null;

  const input = h("textarea", {
    value: question,
    rows: 2,
    placeholder: t("panel.placeholder"),
    style: S.input,
    onChange: function (event) {
      setQuestion(event.target.value);
    },
    onKeyDown: onKeyDown
  });

  const footer = h(
    "div",
    { style: S.footer },
    h("span", { style: S.status }, asking ? t("panel.sending") : t("panel.shortcut")),
    h("div", { style: S.spacer }),
    asking
      ? h(
          "button",
          {
            type: "button",
            style: S.secondary,
            onClick: stop
          },
          t("panel.stop")
        )
      : h(
          "button",
          {
            type: "button",
            style: S.primary,
            onClick: submit
          },
          t("panel.send")
        )
  );

  const errorBox = error ? h("div", { style: S.error }, error) : null;

  const answerBox =
    answer === ""
      ? null
      : h(
          "div",
          { style: S.answerBox },
          h(
            "div",
            { style: S.answerHeader },
            h("span", { style: S.label }, t("panel.answerLabel")),
            h("div", { style: S.spacer }),
            h(
              "button",
              {
                type: "button",
                style: S.linkButton,
                onClick: copy
              },
              copied ? t("panel.copied") : t("panel.copy")
            )
          ),
          h("div", { style: S.answerBody }, answer)
        );

  const card = h(
    "div",
    { style: S.card },
    header,
    h("div", { style: S.hint }, t("panel.hint")),
    questionLine,
    input,
    footer,
    errorBox,
    answerBox
  );

  return h(
    "div",
    { style: S.wrap },
    h(
      "div",
      { style: S.chipRow },
      h(
        "button",
        {
          type: "button",
          style: open ? S.chipActive : S.chip,
          title: t("button.title"),
          onClick: function () {
            setOpen(!open);
          }
        },
        open ? t("button.open") : t("button.idle")
      )
    ),
    open ? card : null
  );
}

function apply(ctx) {
  ctx.effect(function () {
    return ctx.locale.register(NS, { zh: zh, en: en });
  });
  const t = ctx.locale.bind(NS);
  const slots = ctx.get("slots");
  const remote = ctx.get("remote");

  const execute = function (session, line, signal) {
    return remote.commands.execute(session, line, [], signal).then(
      function (response) {
        if (!response || !response.ok) {
          const failure = (response && response.error) || {};
          const code = failure.code;
          const details = failure.details;
          const reason = details && typeof details === "object" && typeof details.reason === "string" ? details.reason : "";
          if (code === "agent-busy" || code === "session/agent-busy") {
            const ownedBySubagent =
              reason === "use subagent delivery for this child session" ||
              failure.message === "session \"" + session + "\" is owned by subagent routing";
            throw new Error(ownedBySubagent ? t("panel.subagent") : t("panel.busy"));
          }
          throw new Error(failure.message || t("panel.failed"));
        }
        const value = response.value;
        const result = value && value.result;
        if (!result) throw new Error(t("panel.failed"));
        return {
          kind: result.kind,
          text: result.text === void 0 || result.text === null ? "" : String(result.text)
        };
      },
      function (thrown) {
        throw new Error(messageOf(thrown) || t("panel.failed"));
      }
    );
  };

  if (slots && typeof slots.inject === "function") {
    slots.inject("conversation.input.dock", function () {
      return slots.register(
        { name: "conversation.input.dock", id: "dsh-side-ask", order: -40, locale: NS },
        function (props) {
          return h(SideAskPanel, {
            key: props && props.session ? props.session.sessionId : "none",
            session: props ? props.session : void 0,
            t: props && typeof props.t === "function" ? props.t : t,
            execute: execute
          });
        }
      );
    });
    slots.inject("conversation.chat.commandview", function () {
      const disposers = ["sideask-run", "sideask-close"].map(function (key) {
        return slots.register({ name: "conversation.chat.commandview", key: key }, function () {
          return null;
        });
      });
      return function () {
        disposers.forEach(function (dispose) {
          if (typeof dispose === "function") dispose();
        });
      };
    });
  }
}

module.exports = {
  apply: apply,
  inject: ["slots", "remote", "remote.commands", "locale", "conversation", "sessions"]
};
return module.exports;
}});
