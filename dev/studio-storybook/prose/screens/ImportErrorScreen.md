---
source: stories/screens/ImportErrorScreen.stories.tsx
title: 'Navbar & Shell/Screens/Import Error'
blocks: 4
roundtrip: true
sourceHash: 96580699fbb74524
---

<!-- @component -->

ImportErrorScreen is the screen for a failed dynamic import: the studio tried to load a chunk and could not.

|        |                                                                 |
| ------ | --------------------------------------------------------------- |
| Source | `packages/sanity/src/core/studio/screens/ImportErrorScreen.tsx` |
| Tier   | CHROME                                                          |

Almost always caused by a redeploy: a browser holding an old build asks for a chunk hash that no longer exists on the server. The fix is a reload, and the screen knows that.

> **Why it matters:** this is one of very few error screens anywhere that can honestly say "the way to fix this is to reload", and it is built around that certainty. With auto-reload set it does not just offer the button, it counts down from five and reloads on its own, a self-healing error state. That is only defensible because the diagnosis is reliable: a missing chunk after a deploy is fixed by fetching the new index, every time. Compare the fallback error screen, which faces an error it cannot classify and therefore offers no automatic anything.

**A detail with real consequences:** the stack trace is rendered only when `isDev`. In a production studio an editor sees a heading, a sentence, and a Reload button - no message, no stack. That is a deliberate trade (stack traces are noise to an editor and leak build paths) and it means the screen you debug is never the screen your users saw.

**Harness note:** `isDev` is resolved at build time from the bundler environment, so which branch these stories show depends on how the storybook was built - the dev server shows the developer view, a static build shows the production one. The stories are written to be read either way, and the difference is itself worth noticing.

<!-- @story Default -->

The resting state: an explanation and a Reload button, waiting for the user to act. In a development build the error message and stack appear in a critical-toned card below the text; in a production build they do not.

<!-- @story WithEventId -->

When error reporting is wired up, the report id is rendered alongside the stack so it can be quoted in a support conversation. Note it shares the `isDev` gate with the stack - so the identifier that exists specifically to be passed to somebody else is hidden in exactly the build where a user would need to pass it.

<!-- @story AutoReloading -->

Watch the text: "Reloading in 5s…" ticks down once a second, driven by a real `rxjs` `timer`, and the button relabels to "Reload now". The countdown is live, not a screenshot of one.

It is cut short at two seconds on purpose. At zero the component calls `window.location.reload()`, which here would reload the storybook and restart the countdown - an endless loop, and one that would take the docs page with it. `window.location.reload` cannot be stubbed in Chrome, so the harness unmounts the screen instead. The countdown you are watching is real; the reload at the end of it is described rather than performed.

This is a self-healing error state, and it is the only one in the studio. It is affordable because the diagnosis is reliable: a chunk that 404s after a redeploy is fixed by fetching the new index, every time.
