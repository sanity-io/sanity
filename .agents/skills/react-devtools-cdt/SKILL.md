---
name: react-devtools-cdt
description: Set up react-devtools-cdt-mcp so Chrome DevTools MCP can inspect a running Sanity Studio or app. Use when the user mentions react-devtools-cdt-mcp, Chrome DevTools MCP third-party React tools, CDT, react_get_component_tree, Missing internals for renderer, or installing a React DevTools hook before Studio loads.
---

# React DevTools through Chrome DevTools MCP

`react-devtools-cdt-mcp` is a browser library, not an MCP server. [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) 1.3.0+ discovers a `react` tool group from the page when started with `--categoryExperimentalThirdParty=true`.

This is not the `react-devtools` skill. That skill is the `agent-react-devtools` CLI. Use this skill when inspection goes through Chrome DevTools MCP.

## CLI requirement

`react-dom` reads `__REACT_DEVTOOLS_GLOBAL_HOOK__` once, when its module initializes. `@sanity/cli-build` 6.4.2 generates the browser entry so the user module is imported first:

- Studio: `import studioConfig from "…/sanity.config…"` then `import {renderStudio} from "sanity"`
- App: `import App from "…"` then `import {createRoot} from "react-dom/client"`

Older CLIs import `sanity` or `react-dom` first. The hook is then too late, and `react_get_component_tree` returns `{error: "Missing internals for renderer 0"}`. After `sanity dev` starts, confirm `.sanity/runtime/app.js` has that order. `@sanity/cli` `^8.13.0` accepts cli-build `^6.4.1`, so a lockfile can still be on 6.4.1.

## Wire the hook

Install `react-devtools-cdt-mcp` in the studio or app. Make this the first static import of `sanity.config.ts`, or of the app entry, before `sanity`, `react`, or `react-dom`:

```ts
import 'react-devtools-cdt-mcp/register'
```

A dynamic `import()` in the file body runs after those static imports and misses the hook. `sanity dev` honors the static import, including the test studio's `unstable_bundledDev`. Reload after changing the config.

Add the import only for the debugging session, then remove it. `react-devtools-cdt-mcp/register` throws outside a real browser. Commands that load `sanity.config.ts` in Node, such as `sanity schema extract`, fail with `target.addEventListener is not a function` when only a partial `window` exists. `sanity dev` itself still starts.

## Chrome DevTools MCP

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest", "--categoryExperimentalThirdParty=true"]
    }
  }
}
```

Open the running studio in that browser. `list_3p_developer_tools` lists the `react` group. Call a tool with `execute_3p_developer_tool`.

Uids such as `r5` stay stable until the page reloads. A successful tree contains `createRoot()` and `Studio`, not `Missing internals for renderer 0`.

| Tool | Returns |
| --- | --- |
| `react_get_component_tree` | `{nodes}` of `{uid, type, name, key, firstChild, nextSibling}`. Optional `depth` (default 20) and `rootUid`. |
| `react_get_component_by_uid` | One component. `includeHooks: true` re-renders it to read hooks; effects do not run. |
| `react_get_component_by_dom_element` | Host component for a DOM element uid `{uid}`. |
| `react_find_components` | Case-insensitive name substring. |
| `react_get_component_source` | `{source: {name, fileName, line, column}}` or `{source: null}`. |
| `react_get_owner_stack` / `react_get_parent_stack` | Owner chain (JSX) or mounted parents. |
| `react_start_profiling` / `react_stop_profiling` | Start or stop a trace. Durations are milliseconds. |
| `react_get_trace_overview` / `react_get_commit_report` | Per-commit timings, then one commit's components. |

## Limits

- `sanity build` does not guarantee this order. The production bundle can evaluate shared chunks (`react-dom`, or external `sanity` when auto-updates are on) before the inlined config. Use `sanity dev`.
- Vite's React Refresh preamble installs a stub hook before the entry module. `register` wraps that stub. The console line "Download the React DevTools…" still prints, because the stub has no `checkDCE`. That line does not mean the hook was missed.
- This package does not set `window.__dtmcp`. That global belongs to chrome-devtools-mcp after it attaches.
