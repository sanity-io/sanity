# Command Reference

## Daemon Management

### `agent-react-devtools start [--port N]`

Start the background daemon. Default port: 8097. The daemon listens for WebSocket connections from React apps and IPC connections from the CLI. Auto-starts when you run any other command, so you rarely need this explicitly.

### `agent-react-devtools stop`

Stop the daemon process. All connection state is lost.

### `agent-react-devtools status`

Show daemon status: port, connected apps, component count, profiling state, uptime, and last connection event.

Output:

```
Daemon: running (port 8097)
Apps: 1 connected, 42 components
Last event: app connected 3s ago
Uptime: 120s
```

If profiling is active, shows `Profiling: active`.

### `agent-react-devtools wait --connected [--timeout S]`

Block until at least one React app connects via WebSocket. Resolves immediately if already connected. Default timeout: 30s. Exits non-zero on timeout.

### `agent-react-devtools wait --component <name> [--timeout S]`

Block until a component with the given display name appears in the tree. Uses exact name matching. Useful after a reload to wait for a specific part of the UI to render. Default timeout: 30s. Exits non-zero on timeout.

## Component Inspection

### `agent-react-devtools get tree [--depth N]`

Print the component hierarchy as an indented tree. Each node shows:

- Label (`@c1`, `@c2`, ...) — stable within a session, resets on app reload
- Type tag (`fn`, `cls`, `host`, `memo`, `fRef`, `susp`, `ctx`)
- Display name
- Key (if present)

Use `--depth N` to limit tree depth. Recommended for large apps.

### `agent-react-devtools get component <@cN | id>`

Inspect a single component. Shows:

- **props** — all prop values (functions shown as `ƒ`, long values truncated at 60 chars)
- **state** — state values (class components and useState)
- **hooks** — all hooks with current values and sub-hooks

Accepts a label (`@c5`) or numeric React fiber ID.

### `agent-react-devtools find <name> [--exact]`

Search components by display name. Default is case-insensitive substring match. Use `--exact` for exact match.

Returns a flat list of matching components with labels, types, and keys.

### `agent-react-devtools count`

Count components by type. Output: `42 components (fn:25 host:12 memo:3 cls:2)`.

### `agent-react-devtools errors`

List all components that have non-zero error or warning counts. React tracks console errors and warnings per component; this command surfaces them.

Output example:

```
@c5 [fn] Form ⚠2 ✗1
@c8 [fn] Input ✗3
```

`⚠N` = N warnings, `✗N` = N errors. Returns "No components with errors or warnings" when everything is clean.

Error/warning annotations also appear in `get tree`, `get component`, and `find` output when counts are non-zero.

## Profiling

### `agent-react-devtools profile start [name]`

Start a profiling session. Optional name for identification. Only one session can be active at a time.

### `agent-react-devtools profile stop`

Stop profiling and collect data from React. Shows a summary with duration, commit count, and top rendered components.

### `agent-react-devtools profile slow [--limit N]`

Rank components by average render duration (slowest first). Default limit: 10.

Output columns: label, type tag, component name, avg duration, max duration, render count, all causes, changed keys.

### `agent-react-devtools profile rerenders [--limit N]`

Rank components by render count (most re-renders first). Default limit: 10.

Output columns: label, type tag, component name, render count, all causes, changed keys.

### `agent-react-devtools profile report <@cN | id>`

Detailed render report for a single component: render count, avg/max/total duration, all render causes, changed keys.

### `agent-react-devtools profile timeline [--limit N] [--offset N] [--sort duration|timeline]`

Chronological list of React commits during the profiling session. Each entry: index, duration, component count. Default limit: 20.

The header shows how many commits were returned and the total: `Commit timeline (showing 1–20 of 87):`. When all commits fit, it shows `Commit timeline (42 commits):`.

Default order is chronological (timeline order). `--sort duration` re-orders entries by duration descending (most expensive first) before applying `--limit` — use this to find the heaviest commits. `--sort timeline` explicitly requests chronological order (same as the default).

`--offset N` skips the first N entries (after sorting). Use with `--limit` to page through commits or skip a known-good warm-up region.

### `agent-react-devtools profile commit <N | #N> [--limit N]`

Detail for a specific commit by index. Shows per-component self/total duration, render causes, and changed keys.

### `agent-react-devtools profile export <file>`

Export profiling data as a JSON file importable in the React DevTools Profiler tab. The file can also be used as input to `profile diff`. Requires an active or recently stopped profiling session.

### `agent-react-devtools profile diff <before.json> <after.json> [--limit N] [--threshold N]`

Compare two exported profiling sessions and show regressed, improved, new, and removed components. Default threshold: 5% — changes below this percentage are not reported. Use `--limit N` to cap the number of components shown per category. Does **not** require the daemon to be running.

### Changed Keys

When React DevTools reports which specific props, state keys, or hooks triggered a re-render, profiling commands append a `changed:` suffix:

```
changed: props: onClick, className  state: count  hooks: #0
```

Categories with no changes are omitted. Keys are deduplicated across commits in aggregate reports (`profile slow`, `profile rerenders`, `profile report`).

## Setup

### `agent-react-devtools init [--dry-run]`

Auto-detect the framework in the current directory and configure the devtools connection. Supports Vite, Next.js, CRA, and Expo/React Native.

Use `--dry-run` to preview changes without writing files.
