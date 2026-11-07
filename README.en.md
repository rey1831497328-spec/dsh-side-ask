# dsh-side-ask

A side-ask panel for DeepSeek Harness. Ask a question against the context of the current conversation; the answer lives only inside the panel and is **never written into the main session history**, so it costs no main-context tokens. Asking a new question clears the previous one.

## Why

While reading long material you keep having small questions. Asking them in the main thread permanently pollutes the context. A side-ask is a one-shot branch: it can see the finished part of the main conversation, but the main conversation never learns what you asked.

## Requirements

- DSH Desktop (Cordis plugin system) with a `fork` subagent provider (`provider.inheritsParentContext`). Otherwise the command answers "no side-ask provider available".
- Verified on: DSH Desktop, 2026-11 build, Windows.

## Install

```powershell
$PluginSource = "C:\path\to\dsh-side-ask"
$ProfileDir   = "$env:USERPROFILE\.dsh\profiles\desktop"

git clone https://github.com/<your-name>/dsh-side-ask.git $PluginSource
New-Item -ItemType Junction -Path "$ProfileDir\node_modules\dsh-side-ask" -Target $PluginSource
# then edit $ProfileDir\package.json:
#   dependencies:        "dsh-side-ask": "file:C:/path/to/dsh-side-ask"
#   dsh.profile.bundles: append "dsh-side-ask"
```

Restart DSH Desktop — profile changes are not hot-reloaded.

## Usage

Click the "旁问" chip above the composer, type a question, press Enter. Or use the slash command:

```
/sideask why is this a Map instead of a plain object?
```

## Behaviour

| Item | Implementation |
| --- | --- |
| Context | `fork` subagent provider — inherits the finished part of the parent conversation |
| Writes to main session | No. Nothing is appended to the main session log |
| Single slot | A new question clears the previous Q&A |
| Tool access | `ctx.tools.guard` denies every tool call for the side-ask subagent; text-only answers |
| Cancel | "Stop" → `/sideask-close <id>` aborts the subagent |
| Timeout | 300000 ms, max 4 concurrent side-asks |
| Inside subagent sessions | Not rendered |

## Known limitations

- Single-turn, no memory across questions (a direct consequence of not entering context).
- Background is a snapshot of the main conversation at send time; truncation behaviour on very long conversations is untested.
- Requires a fork provider; markdown in answers is shown as plain text.

## Development

`lib/index.js` is the host half (commands + subagent lifecycle), `lib/client.js` the browser half (dock card). No build step: `lib/client.js` is a hand-written `window.__ModuleLoader__.load({...})` wrapper that only `require("react")`.

Beware: `agent/created` may fire *before* `startActivation` resolves, so install the guard before calling it.

## License

MIT
