# Profiling Guide

## Quick Start

```bash
agent-react-devtools profile start
# Trigger the slow interaction (type, click, navigate)
agent-react-devtools profile stop
agent-react-devtools profile slow --limit 5
```

## Step-by-Step Workflow

### 1. Establish a Baseline

Before profiling, check the current state:

```bash
agent-react-devtools status          # Confirm app is connected
agent-react-devtools count           # How many components are mounted
agent-react-devtools get tree --depth 3  # Understand the structure
```

### 2. Profile the Interaction

Start profiling, then trigger the specific interaction the user reports as slow:

```bash
agent-react-devtools profile start "typing in search"
```

The user should perform the interaction now. If using agent-browser, you can drive the interaction programmatically.

```bash
agent-react-devtools profile stop
```

### 3. Identify Bottlenecks

**Slowest components** — which components take the most time per render:

```bash
agent-react-devtools profile slow --limit 5
```

**Most re-rendered** — which components render too often:

```bash
agent-react-devtools profile rerenders --limit 5
```

These two views complement each other:

- A component that renders 100 times at 0.1ms each = 10ms total (re-render problem)
- A component that renders 2 times at 50ms each = 100ms total (slow render problem)

### 4. Drill Into Specific Components

Once you identify a suspect, get its full render report:

```bash
agent-react-devtools profile report @c12
```

This shows all render causes and the specific changed keys (e.g. `changed: props: onClick, className  state: count`). Use the changed keys to pinpoint exactly what to stabilize or investigate. Common patterns:

| Cause             | Changed keys example    | Meaning                                  | Typical Fix                                                       |
| ----------------- | ----------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| `parent-rendered` | _(none)_                | Parent re-rendered, child has no bailout | Wrap child in `React.memo()`                                      |
| `props-changed`   | `props: onClick, style` | Received new prop references             | Stabilize the listed props with `useMemo`/`useCallback` in parent |
| `state-changed`   | `state: count, filter`  | Component's own state changed            | Check if the listed state updates are necessary                   |
| `hooks-changed`   | `hooks: #0, #2`         | A hook dependency changed                | Review deps of the listed hooks (by index)                        |
| `first-mount`     | _(none)_                | Initial render                           | Normal — not a problem                                            |

### 5. Inspect the Component

Read the component's current props and hooks to understand what's changing:

```bash
agent-react-devtools get component @c12
```

Look for:

- Function props (`ƒ`) — likely unstable references if not wrapped in `useCallback`
- Object/array props — likely new references if not wrapped in `useMemo`
- State that updates too frequently

### 6. Fix and Verify

After applying the fix, re-profile with the same interaction:

```bash
agent-react-devtools profile start "after fix"
# Same interaction
agent-react-devtools profile stop
agent-react-devtools profile slow --limit 5
```

Compare render counts and durations to confirm improvement.

## Export and Diff Workflow

### Export Profiling Data

After stopping a profiling session, export the data to a JSON file. This file can be imported into the React DevTools Profiler tab for visual analysis, or used as input to `profile diff`.

```bash
agent-react-devtools profile stop
agent-react-devtools profile export baseline.json
```

### Compare Two Profiling Sessions

To identify regressions or verify improvements, export profiles before and after a change, then diff them:

```bash
# Before the change
agent-react-devtools profile start "before"
# ... interact with the app ...
agent-react-devtools profile stop
agent-react-devtools profile export before.json

# After the change
agent-react-devtools profile start "after"
# ... same interaction ...
agent-react-devtools profile stop
agent-react-devtools profile export after.json

# Compare
agent-react-devtools profile diff before.json after.json
```

The diff shows regressed, improved, new, and removed components. Use `--threshold` to adjust sensitivity (default: 5%) and `--limit` to cap the number of components per category.

## Common Performance Issues

### Cascading re-renders from context or lifted state

A parent component re-renders (e.g., from a timer or context change) and all children re-render because none use `React.memo`. Look for high re-render counts with `parent-rendered` cause.

### Unstable prop references

Parent passes `onClick={() => ...}` or `style={{...}}` inline — creates new references every render, defeating `memo()`. The child shows `props-changed` as the cause even though the values are semantically identical. The `changed:` output tells you exactly which props are the culprits (e.g. `changed: props: onClick, style`).

### Expensive computations without memoization

A component does heavy work (filtering, sorting, formatting) on every render. Shows up as high avg render time. Fix with `useMemo`.

### State updates in effects causing render loops

An effect updates state on every render, causing unnecessary commit cycles. Look for unusually high commit counts in `profile timeline`.
