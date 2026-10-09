---
name: react-devtools-mcp
description: Inspect and profile the React component tree of a running Sanity Studio through chrome-devtools-mcp (React DevTools over the Chrome DevTools Protocol, via react-devtools-cdt-mcp). Use when investigating a studio perf regression, finding which components render in a slow commit, reading props and hooks at runtime, resolving a component to its source file, or when the user asks "why does this re-render" about the test studio. Works from Cursor's MCP config and from the terminal (chrome-devtools CLI daemon), so it also works for cloud agents; complements the agent-react-devtools skill (react-devtools), which uses a different transport.
---

# React DevTools for agents (chrome-devtools-mcp + react-devtools-cdt-mcp)

[`react-devtools-cdt-mcp`](https://github.com/facebook/react/tree/main/packages/react-devtools-cdt-mcp)
is **not** an MCP server. It is a browser library that installs a lightweight React DevTools hook
in the page and registers twelve `react_*` tools that
[`chrome-devtools-mcp`](https://github.com/ChromeDevTools/chrome-devtools-mcp) discovers through
its experimental third-party developer tools API (`--categoryExperimentalThirdParty=true`).
`chrome-devtools-mcp` is the MCP server; it talks to Chrome over the Chrome DevTools Protocol, so
the same session also gives you `take_snapshot`, `click`, `navigate_page`, `performance_start_trace`
and the rest of its tools.

In this repo `dev/test-studio/sanity.cli.ts` loads `react-devtools-cdt-mcp/register` before the
studio entry when `ENABLE_REACT_DEVTOOLS_MCP=true`, and turns React StrictMode off for that run
(development StrictMode double-renders and would inflate every profile;
`SANITY_STUDIO_REACT_STRICT_MODE=true` overrides). Nothing changes for `pnpm dev` or
`sanity build`. The older `agent-react-devtools` path (`pnpm react-devtools:test-studio`, skill
`react-devtools`) installs the full DevTools backend over a WebSocket daemon instead; setting both
flags is rejected when the CLI config loads.

## Setup (three processes)

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"   # cloud VM: Node >= 22.18 for the build
pnpm build                                                   # once; sanity dev needs packages/sanity/lib

# 1. Test studio with the React DevTools hook installed, StrictMode off (port 3333, long-running)
pnpm react-devtools-mcp:test-studio

# 2. Chrome with the remote debugging port open, on the studio. With STUDIO_AUTH_TOKEN set
#    (cloud agents have it) the studio is signed in on load. The token is never printed and
#    neither it nor anything leading to it is put on Chrome's command line: Chrome starts on
#    about:blank, and only once its debugging endpoint has been authenticated as this Chrome's
#    (see the reuse rule below) is it navigated, over that endpoint, to a one-time loopback
#    redirect that forwards to the #token= url. Chrome is started with an allowlisted
#    environment instead of your shell's: HOME, PATH, USER, LOGNAME, SHELL, TMPDIR/TMP/TEMP, LANG/LANGUAGE and the
#    locale categories (LC_ALL, LC_MESSAGES, LC_TIME, ...), TZ, DISPLAY/WAYLAND_DISPLAY/XAUTHORITY
#    and selected XDG names (XDG_RUNTIME_DIR, XDG_SESSION_TYPE, XDG_CURRENT_DESKTOP, the
#    XDG_*_HOME/_DIRS base directories), DBUS_SESSION_BUS_ADDRESS, HTTP(S)_PROXY/NO_PROXY,
#    SSL_CERT_FILE/SSL_CERT_DIR, CHROME_PATH/CHROME_DEVEL_SANDBOX/CHROME_HEADLESS/CHROME_LOG_FILE,
#    the Windows essentials (SystemRoot, USERPROFILE, LOCALAPPDATA, ..., matched
#    case-insensitively) and macOS's __CF_USER_TEXT_ENCODING. Every entry is an exact name,
#    never a prefix, so CHROME_API_KEY, SSL_CERT_PASSWORD or XDG_API_KEY never pass; the full
#    list is scripts/chromeEnvironment.ts, unit-tested in scripts/chromeEnvironment.test.ts. No
#    other variable inherited from your shell, tokens and keys included, reaches
#    /proc/<pid>/environ; what you will still see there is what Chrome's own wrapper script adds
#    (CHROME_WRAPPER, CHROME_DESKTOP, ...). The sign-in policy below is scripts/tokenRouting.ts, with its own
#    matrix test (scripts/tokenRouting.test.ts). Extra Chrome arguments after `--` cannot set
#    --remote-debugging-address/-port/-pipe, --user-data-dir or --headless (rejected up front)
#    and are placed before the launcher's switches, which Chromium keeps for a repeated switch
#    (scripts/chromeArgs.ts, tested in scripts/chromeArgs.test.ts). Only loopback origins (localhost,
#    127.0.0.1, [::1]) get the token automatically; any other origin would read it from
#    location.hash, so an https origin needs --inject-token and a plaintext http origin the
#    separately named --inject-token-insecure-http (token on the wire). Without the flag a
#    notice is printed and the url opens signed out; --inject-token on plaintext http fails.
#    Re-running the command opens a new tab in the Chrome that is already listening on the
#    port instead of starting a second one — but only in the launcher's own Chrome: its
#    stderr is captured to node_modules/.cache/react-devtools-mcp/chrome-stderr.log, the
#    browser target it announces there (ws://127.0.0.1:<port>/devtools/browser/<uuid>, a
#    fresh uuid per start) is recorded with its pid in launcher.json next to it once the
#    launch succeeded, and a later run reuses the listener only while that process is still
#    running and the listener advertises that target in /json/version
#    (scripts/devtoolsEndpoint.ts, tested in scripts/devtoolsEndpoint.test.ts). A process
#    that merely took the port is refused before the redirect even exists, so it never
#    receives the url whose Location header carries the token; the launcher itself is
#    scripts/chromeLauncher.ts, whose redirect, refusal and cleanup paths are covered by
#    scripts/chromeLauncher.test.ts against real loopback servers. Concurrent runs take turns
#    through one lock directory (launch.lock next to the log — one lock, whatever the port,
#    since profile and state are shared; a lock whose owner is gone is reclaimed by an atomic
#    rename, so only one contender gets it), and every launch has a stderr file of its own, so
#    the second run reuses the first one's Chrome instead of racing it. The target itself is public to
#    anything that could reach the port while Chrome ran (and such a process had the
#    signed-in page through CDP already); the live-process requirement is what keeps it from
#    being replayed after that Chrome exits, short of a recycled pid.
pnpm react-devtools-mcp:chrome                       # http://localhost:3333/test
pnpm react-devtools-mcp:chrome http://localhost:3333/test/structure/author
pnpm react-devtools-mcp:chrome --headless            # no display
pnpm react-devtools-mcp:chrome --port=9333           # 1-65535; also change --browserUrl below
pnpm react-devtools-mcp:chrome https://my-studio.sanity.studio/ --inject-token   # deployed studio, explicit opt-in

# 3. chrome-devtools-mcp attached to that Chrome — pick ONE of:
#    a) Cursor: .cursor/mcp.json defines the `chrome-devtools` server (the workspace-installed,
#       lockfile-pinned chrome-devtools-mcp under dev/test-studio/node_modules) with
#       --categoryExperimentalThirdParty=true --browserUrl=http://127.0.0.1:9222
#    b) Terminal / cloud agents (same tools, no MCP client needed):
pnpm --filter sanity-test-studio exec chrome-devtools start \
  --categoryExperimentalThirdParty=true --browserUrl=http://127.0.0.1:9222
```

## Workflow

Every command below is shown for the CLI (`CD="pnpm --filter sanity-test-studio exec chrome-devtools"`).
Through MCP the tool names are identical (`list_pages`, `list_3p_developer_tools`,
`execute_3p_developer_tool`, `take_snapshot`, `click`, `navigate_page`); `params` is a JSON string.

```bash
$CD list_pages                                   # page ids; the studio page is normally 1
$CD list_3p_developer_tools 1                    # REQUIRED once per page load: discovers the react_* tools
$CD execute_3p_developer_tool 1 react_find_components --params '{"name":"DocumentPane"}'
$CD execute_3p_developer_tool 1 react_get_component_tree --params '{"depth":400}'      # the default depth of 20 cuts the studio's tree short; ~10k fibers in total
$CD execute_3p_developer_tool 1 react_get_component_by_uid --params '{"uid":"r9553","includeHooks":true}'
$CD execute_3p_developer_tool 1 react_get_component_source --params '{"uid":"r10891"}'
$CD execute_3p_developer_tool 1 react_get_parent_stack --params '{"uid":"r10891"}'

# Profile an interaction
$CD execute_3p_developer_tool 1 react_start_profiling --params '{"traceName":"open-pane"}'
$CD take_snapshot 1                              # find the element uid to interact with (e.g. 1_57)
$CD click 1 1_57
$CD execute_3p_developer_tool 1 react_stop_profiling
$CD execute_3p_developer_tool 1 react_get_trace_overview --params '{"traceName":"open-pane"}'
$CD execute_3p_developer_tool 1 react_get_commit_report --params '{"traceName":"open-pane","commitIndex":8}'

$CD navigate_page 1 --type url --url http://localhost:3333/test/structure/book
$CD stop                                         # stop the daemon when done
```

Add `--output-format json` for machine-readable output: the result is `{"message": "<json>"}`,
i.e. parse `message` a second time. A `react_get_component_tree` of the whole studio is several MB;
prefer `react_find_components` plus `rootUid` to scope the walk.

Tools: `react_get_component_tree`, `react_get_component_by_uid`, `react_get_component_by_dom_element`
(`{"element":{"uid":"1_57"}}` from `take_snapshot`), `react_find_components`,
`react_get_component_source`, `react_get_owner_stack_trace`, `react_get_parent_stack`,
`react_get_owner_stack`, `react_start_profiling`, `react_stop_profiling`,
`react_get_trace_overview`, `react_get_commit_report`.

## Reading the output

Component uids (`r9553`) are stable across tools and re-renders but reset on page reload — re-run
`list_3p_developer_tools` and the tree/find call after `navigate_page` or a reload. React Compiler
output shows as `Forget(StructureTool)`, memoized components as `Memo(...)`, styled-components as
`StyledCard` / `styled.div`. Durations are milliseconds; `componentsChanged` counts fibers that
rendered in the commit; `priority` is the lane (`Sync`, `Default`, `Idle`, ...).

Real run on `/test/structure`, profiling a click on the "Standard inputs" list item (10 commits,
272 ms of render time in total):

```
$CD execute_3p_developer_tool 1 react_get_trace_overview --params '{"traceName":"open-standard-inputs"}'
  commit 8  committedAt=1140  render=105.2  layout=0    passive=0    componentsChanged=10270   <- slowest
  commit 3  committedAt=935   render=67.4   layout=2.9  passive=0.8  componentsChanged=10559
  commit 0  committedAt=803   render=32.4   layout=1.3  passive=0.9  componentsChanged=9820

$CD execute_3p_developer_tool 1 react_get_commit_report --params '{"traceName":"open-standard-inputs","commitIndex":8}'
  priority: Idle, 10270 components. Highest selfDuration:
    r11856 function   Forget(TextComponent)       self=5.9 actual=6.2
    r10935 forwardRef StyledCard                  self=5.6 actual=9.6
    r4226  forwardRef Selectable                  self=5.2 actual=5.5
    r10891 memo       Memo(CommandListComponent)  self=3.4 actual=6.2
  Highest actualDuration is the pane transition subtree: Offscreen > PresenceChild > PopChild (62 ms).

$CD execute_3p_developer_tool 1 react_get_component_source --params '{"uid":"r10891"}'
  {"source":{"name":"CommandListComponent","fileName":"http://localhost:3333/@fs/.../packages/sanity/src/core/components/commandList/CommandList.tsx","line":73,"column":33}}
```

Sort the commit report by `selfDuration` to find components that are slow themselves; the default
`actualDuration` order surfaces wrappers whose subtree is slow. Sources inside the `sanity` package
resolve to `packages/sanity/src/...` (served via `/@fs/`); components from pre-bundled dependencies
resolve to a `/node_modules/.sanity/vite/deps/...` chunk.

## Gotchas

- `execute_3p_developer_tool` answers "Tool react_... not found" until `list_3p_developer_tools`
  has run for that page load.
- No `react` group listed: the studio was started without `ENABLE_REACT_DEVTOOLS_MCP=true`, or the
  page is not the studio (check `list_pages`).
- Memory on the cloud VM: `sanity dev` in bundled dev mode (`unstable_bundledDev: true`, the
  default) reached 7.1 GB RSS with one `/test` page open and chrome-devtools-mcp attached. Classic
  mode (temporarily `unstable_bundledDev: false` in `dev/test-studio/sanity.cli.ts`) stayed under
  2 GB for the same session; use it when memory is tight, and never run `pnpm check:oxlint` while
  the studio is up (see AGENTS.md).
- The `chrome-devtools` CLI and the MCP server are the same daemon; do not run both against the
  same Chrome at once. `pnpm --filter sanity-test-studio exec chrome-devtools status` / `stop`.
- Chrome keeps running after `react-devtools-mcp:chrome` returns (it prints the pid, or reports
  that it reused the browser already listening on the port); the profile is reused from
  `node_modules/.cache/react-devtools-mcp/chrome-profile`, so the login survives restarts.
  `list_pages` prints page URLs: right after launch the URL may still carry `#token=...` until
  the studio strips it, so wait for `list_pages` to show `/test/structure` before pasting output
  anywhere.
- "Chrome exited before opening its debugging port": a Chrome using the profile is already
  running without `--remote-debugging-port` (for example started by hand). Close it and retry.
  Chrome's own output is in `node_modules/.cache/react-devtools-mcp/chrome-stderr.log` (each
  launch writes its own `chrome-stderr.<id>.log`, promoted to that name once the launch
  succeeded; a failed launch's file stays until the next launch for a look).
- "Something is already listening on http://127.0.0.1:9222, but it is not the Chrome this
  launcher started": another process holds the port (a Chrome started by hand, another tool, or
  something impersonating Chrome), or the launcher's Chrome exited and `launcher.json` points at
  a process that is gone. The launcher only opens urls in the Chrome it started itself, so stop
  that process or pass `--port=<other>` (and change `--browserUrl` to match). The same
  applies when Chrome could not bind the port at launch: current Chrome silently falls back to
  `[::1]` (it ignores `--remote-debugging-address` altogether), the launcher notices from the
  announced address, stops that Chrome again and reports the listener.
- Where the token can still be seen, by design: in the page url (`/json/list`, `list_pages`,
  Chrome's session files) from the redirect until the studio strips the fragment, through the
  debugging port itself, which can run JavaScript in the signed-in page, and by whatever serves
  the loopback studio origin you point the launcher at (the port being yours is the same
  assumption `pnpm dev` makes; a deployed origin needs the explicit `--inject-token`). The
  first two are limited to processes on this machine that can reach 127.0.0.1:9222 **and** to
  the launcher's own Chrome, which is bound to loopback: the redirect url is only ever handed,
  over the debugging endpoint, to a Chrome this launcher started and authenticated (fresh, or
  reused while the recorded process is alive and advertises the browser target it announced on
  stderr, see above; what is left is a listener that replaces that Chrome on the port in the
  milliseconds between the matched `/json/version` answer and the navigate or `/json/new`
  request, or one that observed the target while Chrome ran and also lands on its recycled
  pid), the redirect server is loopback-only, one-shot and gone after the first fetch, and the
  cache and profile directories are created `0700` with the log and state `0600`. Neither the
  token nor the redirect url is ever in Chrome's argv (Chrome starts on `about:blank`), in
  Chrome's environment, in this script's output or in its error messages (a caller-supplied
  fragment is printed as `#…`, and an invalid url argument is never echoed back, only its parsed
  scheme and host at most).
- Set `CHROME_PATH` if Chrome is not found; the script turns on headless automatically when
  `DISPLAY` is unset on Linux.
- To let `chrome-devtools-mcp` launch its own Chrome instead, drop `--browserUrl` (and skip step 2);
  then open the studio with `navigate_page`, which needs the login or the `#token=` URL as a
  tool argument.
