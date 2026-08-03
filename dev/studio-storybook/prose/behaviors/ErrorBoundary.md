---
source: stories/behaviors/ErrorBoundary.stories.tsx
title: 'Laws & Behaviors/ErrorBoundary'
blocks: 3
roundtrip: true
sourceHash: 05168c8866e195f1
---

<!-- @component -->

Render errors happen: a preview meets malformed data, a plugin throws. Without a boundary, one component throwing during render takes the entire Studio down with it. ErrorBoundary is the safety net that keeps that from happening to a whole editor.

|          |                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/ui-components/errorBoundary/ErrorBoundary.tsx`, Studio shadow of `@sanity/ui` `ErrorBoundary`                                                                                                  |
| Tier     | SERVICE. A cross-cutting resilience wrapper: it catches uncaught render errors from any subtree and routes them to the configured `source.onUncaughtError`, supporting every surface without being the editing core |
| Audit    | 🔴 needs-work (`error-messages`). The native caught state is a raw `<Code>` dump of the error message: no plain-language explanation, no next step, no recovery affordance                                          |
| Patterns | `error-messages`                                                                                                                                                                                                    |

ErrorBoundary wraps a subtree, catches the throw, keeps everything around it alive, and hands the error to wherever your workspace wants it logged. It is the difference between "one pane shows an error" and "the editor is gone".

Studio's `ErrorBoundary` wraps `@sanity/ui`'s boundary, adds routing to the workspace `onUncaughtError` config, and forwards to an optional `onCatch` prop. On a caught error the underlying boundary swaps its children for `<Code>{error.message}</Code>`. It has no reset API, recovery requires remounting the boundary (for example bumping a React `key`), which the Recommended story does.

Addressed for `error-messages` looks like the Current vs Recommended pair: replace the raw code dump with an actionable fallback, what happened in plain language, plus a "Try again" control that remounts the subtree.

> **Why it matters:** there is no reset method. Once the boundary has caught, it keeps showing the caught state until it is remounted, clearing the error condition alone leaves the stale message on screen. To recover you must force a remount (bump the boundary's React key), which is exactly what the Recommended story does.

The page closes _in context_: a book document pane whose Author field throws, the boundary holds the rest of the editor alive and offers recovery in its place.

<!-- @story Current -->

Reproduces the audit finding: the boundary renders the error message verbatim as a monospace `<Code>` block. Useful to a developer reading a stack trace, opaque to an editor who just wants to keep working.

<!-- @story Recommended -->

The resolved state: `onCatch` lifts the error to the parent, which renders a designed fallback, what happened in plain language plus a "Try again" button that remounts the subtree (bumping a React `key`, because the boundary exposes no reset). The raw message is still available for anyone who wants it.
