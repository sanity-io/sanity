---
source: stories/presentation/PreviewHeader.stories.tsx
title: 'Overlays & Navigation/Preview Header'
blocks: 7
roundtrip: true
sourceHash: 7b2b9bc061540a74
---

<!-- @component -->

PreviewHeader is the toolbar every Presentation user touches constantly: the URL field, the viewport toggle, the overlay toggle, refresh, and the share and open-in-new-tab controls all live here, reflecting connection state as it changes underneath them.

|          |                                                              |
| -------- | ------------------------------------------------------------ |
| Source   | `packages/sanity/src/presentation/preview/PreviewHeader.tsx` |
| Tier     | SERVICE                                                      |
| Patterns | `visible-system-state`                                       |

It was the last significant gap in the catalog, and it needed one piece of harness that did not exist: a fake XState actor ref.

**Not storied: the share-preview menu.** `SharePreviewMenu` subscribes to the live client for shared-access tokens, a data-fetching subtree rather than a control reflecting input, so these stories run with share access off, which is itself a common studio configuration. Everything else on the toolbar is covered.

What `useSelector` actually needs, and therefore the whole surface `lib/fakeActorRef.ts` has to satisfy, is four things: `matches('loading')` for flat states, `matches({loaded: 'reloading'})` for nested ones, `context.<field>`, and `hasTag('busy')` on the separate preview-url machine. The nested form is the one worth care, `matches('loaded')` must also be true while the machine is in `{loaded: 'reloading'}`, and getting that wrong shows the wrong buttons with no error.

> **Why it matters:** the rule for stubbing is to fake a dependency the component reads as input, and refuse when the thing stubbed is what the story tests. This toolbar is squarely the first kind: its job is laying out controls and reflecting connection state, the state machine is the input it reflects, and the machine's own transitions are covered by the machine's own tests. Faking the actor lets a story pin what the toolbar looks like while reloading, which is otherwise unreachable without a live iframe and a live connection to a running front end.

<!-- @story Loaded -->

The resting state. The preview has connected and rendered, so every control is live: the URL field shows the current route, the viewport and overlay toggles are available, refresh is idle.

<!-- @story Loading -->

Before the front end has answered. This is the state an editor sees when their preview URL is wrong or their dev server is down - the toolbar is the only thing on screen still telling them anything.

<!-- @story OverlaysEnabled -->

The overlay toggle reflects `context.visualEditingOverlaysEnabled` - the one piece of machine _context_ the toolbar reads, as opposed to machine state. Compare with the Loaded story: same state, different context, different button.

<!-- @story MobileViewport -->

The viewport toggle set to mobile. A plain prop rather than machine state, because the viewport is a studio preference rather than something the preview connection knows about.

<!-- @story Disconnected -->

The preview is loaded but the overlays connection has dropped - the front end is rendering, and click-to-edit is not working. A state that is easy to miss in development because it usually resolves itself, and confusing in the wild because the page looks fine.

<!-- @story Transitioning -->

The other kind of actor stub: one whose snapshot can be replaced, so a story can drive a transition rather than pin a state. Press the button and the toolbar moves from loaded to reloading and back, with `useSelector` re-rendering the way it would against a real machine.

Use `createControllableActorRef` when the story is about the toolbar **changing**; `createFakeActorRef` when it is about one state.
