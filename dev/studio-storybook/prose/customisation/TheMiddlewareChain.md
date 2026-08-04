---
source: stories/customisation/TheMiddlewareChain.stories.tsx
title: 'Acme'
blocks: 2
roundtrip: true
sourceHash: 0e4ecb314967dcbd
---

<!-- @component -->

renderDefault means the next layer down, not Sanity's component, and installing a single plugin that registers the same seam is enough to make those two readings disagree.

|        |                                                                                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------- |
| Source | `core/config/components/useMiddlewareComponents.tsx`. Every studio and form component seam resolves through this hook |
| Tier   | CORE                                                                                                                  |

Each config in the tree that registers the same seam becomes a middleware layer, and each one receives the layer beneath it as `renderDefault`. If you are the only registrant, the next layer down happens to be Sanity's default and the two readings agree. Install a plugin that registers the same seam and they stop agreeing: your `renderDefault` is now that plugin's component, and Sanity's default is two layers below. The source says so in as many words on line 20: "As we progress through the chain, the meaning of renderDefault changes."

The order inverts the obvious guess. `useMiddlewareComponents` flattens the config tree, calls `.reverse()` on it, and then wraps outward. The effect is that the root config wraps the plugins, not the other way round. Your studio-level customisation is the outermost layer and runs first; a plugin's is nearer the default. Story 2 renders that ordering rather than asserting it.

And a footgun the source flags in a comment: the innermost default component is invoked with `renderDefault: emptyRender`. A component written as a default that nonetheless calls `props.renderDefault` renders an empty `<Fragment />`, silently. That is why `StudioDefault` in this file does not call it.

Every other page here says decorate rather than replace and shows what replacing costs. This one shows what you are actually decorating, which on a studio with plugins installed is frequently not what the author assumed. A plugin that fails to call `renderDefault` disables every customisation registered below it, including Sanity's own, and nothing reports it.

These stories call the real hook against real resolved workspaces. The layers are labelled boxes rather than navbars because the subject is the composition, not the component.

> **Why it matters:** there is no diagnostic for a layer that fails to delegate. The chain does not report it and no warning is emitted, and the layers above the break still render fine, so the failure looks like the studio default quietly changed rather than like an error. If a customisation stops working after installing a plugin, this is the first thing to check.

<!-- @story BrokenChain -->

The same three registrants, except plugin-b never calls `renderDefault`.

Everything below it is gone: Sanity's default component is not rendered, and would not be rendered no matter what it contained. The two layers **above** plugin-b are unaffected and still render, so the failure is not total and does not look like a failure. It looks like the studio default quietly changed.

**This is the practical hazard in the middleware design.** The advice "decorate rather than replace" is usually framed as a cost to the author who replaces: they lose validation, presence, and so on. In a chain it is also a cost imposed on everyone below them, including a studio author who registered a perfectly correct decoration and cannot see why it stopped applying.

There is no diagnostic for this. The chain does not report a layer that failed to delegate, and no warning is emitted. If a customisation stops working after installing a plugin, this is the first thing to check.
