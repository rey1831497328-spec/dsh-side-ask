# dsh-side-ask

给 DeepSeek Harness 加一张「旁问」卡片：借用当前对话的上下文提问，答案只显示在卡片里，**不写进主会话历史**，因此不占主会话上下文。每问一个新问题，上一个问答自动清空。

## 它解决什么

读长材料时经常有临时问题（"这个词这里是什么意思""这一步在做什么"）。直接在主对话里问，这些问答会永久留在上下文里，稀释真正要用的信息。旁问把这部分问答做成一次性支路：能看到主对话已完成的内容，但主对话永远不知道问过什么。

## 形态

输入框上方右对齐一个小 chip，点开是卡片：

- 标题区：旁问 · 不计入上下文 · 关闭
- 问题输入框（Enter 提问，Shift+Enter 换行）
- 答案区（含复制按钮）
- 提问中可点「停止」中断

## 环境要求

- DSH 桌面版（Cordis 插件体系），需要支持子代理的 `fork` provider（`provider.inheritsParentContext` 为真）。不满足时命令返回「没有可用的旁问提供方」。
- 已验证环境：DSH 桌面版 2026-11 版本，Windows。

## 安装

插件目录本身就是一个 DSH bundle（`package.json` 里的 `dsh.bundle.patch` 指向 `cordis.patch.yml`），装法是登记进 profile。

```powershell
# 0) 变量按需修改
$PluginSource = "C:\path\to\dsh-side-ask"
$ProfileDir   = "$env:USERPROFILE\.dsh\profiles\desktop"

# 1) 克隆到本地
git clone https://github.com/<your-name>/dsh-side-ask.git $PluginSource

# 2) 在 profile 的 node_modules 下建目录联接（不复制文件，改源码即时可见）
New-Item -ItemType Junction -Path "$ProfileDir\node_modules\dsh-side-ask" -Target $PluginSource
```

```powershell
# 3) 编辑 $ProfileDir\package.json，加两处
#    dependencies 里加：  "dsh-side-ask": "file:C:/path/to/dsh-side-ask"
#    dsh.profile.bundles 数组末尾加： "dsh-side-ask"
```

改完**重启 DSH 桌面版**。桌面版不会热加载 profile 改动（改 patch 文件、刷新页面都无效）。

不想建联接的话，把插件目录整个复制进 `$ProfileDir\node_modules\dsh-side-ask` 也一样，只是以后改源码要重新复制。

验证装好了：插件页能看到 dsh-side-ask；任意主对话输入框右上方出现「旁问」chip。

## 使用

点 chip → 输入问题 → Enter。答案在卡片里出现，主对话不会多出任何消息。

也可以在输入框直接敲命令：

```
/sideask 这个函数为什么用 Map 而不是对象？
```

## 行为契约

| 项 | 实现 |
| --- | --- |
| 上下文来源 | 子代理 provider 用 `fork`，继承父会话**已完成**的内容 |
| 是否写入主会话 | 否。不 append 任何消息到主会话日志，答案只存在客户端状态里 |
| 单槽 | 提交新问题时清空上一条问题与答案 |
| 工具权限 | 宿主侧给旁问子代理装了 `ctx.tools.guard`，工具调用一律拒绝（含 `send_message`），只允许纯文字回答 |
| 中断 | 卡片「停止」→ `/sideask-close <id>` → abort 子代理 |
| 超时 | 300000 ms |
| 并发上限 | 4 |
| 子代理会话内 | 不渲染（`session.subagent` 为真时返回 null） |

## 已知限制

- 单轮问答，跨问无记忆——这是「不计入上下文」的必然代价：每次都是全新的 fork 子代理，它看不到上一问的答案。
- 背景取「发送那一刻主会话已完成的内容」，超长对话的截断策略未验证。
- 只有 fork provider 可用；不支持纯文字回答以外的输出形态。
- 答案里的 markdown 以纯文本呈现，不做渲染。

## 卸载

```powershell
# 1) 从 profile 的 package.json 里删掉 dependencies 与 bundles 中的 dsh-side-ask
# 2) 断开目录联接（只删联结点，源码目录保留）
cmd /c rmdir "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-side-ask"
# 3) 重启 DSH
```

## 开发

```
package.json         DSH manifest：dsh.bundle.patch + dsh.client{platform:web, inject}
cordis.patch.yml     组合条目：- insert: [{id: dsh-side-ask, name: dsh-side-ask}]
lib/index.js         宿主：注册 /sideask、/sideask-run、/sideask-close，管理子代理生命周期
lib/client.js        客户端：conversation.input.dock 上的卡片 + 内部命令的 null 视图
```

客户端没有构建步骤：`lib/client.js` 是手写的 `window.__ModuleLoader__.load({...})` 包装，只 `require("react")`，其余全部内联 `React.createElement` + 内联样式（配色走 DSH 的 CSS 变量并带回退值）。

宿主半边关键点：

- `ctx.subagents.startActivation({ provider: "fork", delivery: "caller" })` 起子代理，`agent/created` 事件可能在 `startActivation` 返回**之前**触发，所以守卫要在调用前挂好。
- 只认自己起的子代理（按 `childId` 与 agent/session 双重判定），避免误拦别的会话。

## License

MIT
