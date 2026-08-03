---
source: stories/customisation/DocumentActions.stories.tsx
title: 'Move this document out of the active set'
blocks: 4
roundtrip: true
sourceHash: 21191ed10b3c5b03
---

<!-- @component -->

Every other customisation in this chapter hands you `renderDefault` and asks you to return JSX. Actions do not: a document action is a function that returns a description, and the studio decides how to render it. You never draw the button.

|          |                                                                                  |
| -------- | -------------------------------------------------------------------------------- |
| Seam     | `document.actions`, typed `DocumentActionComponent[] \| DocumentActionsResolver` |
| Tier     | SERVICE                                                                          |
| Patterns | `actions`                                                                        |

This is the seam for changing what an editor can do to a document, the Publish button and the menu beside it. The same action has to render as a primary button, as a row in a menu, and as an entry in the command palette, and it should look native in all three without the author knowing which context it landed in. Handing back data rather than markup is what makes that possible.

That means the instinct carried over from `form.components.input`, wrap `renderDefault`, has nothing to grab, and the equivalent move is to call the action you are extending and spread its description.

Two more properties. An action returning `null` is removed entirely, which is how conditional actions work, no `hidden` flag, just absence. And because actions are functions of `DocumentActionProps` (which extends `EditStateFor`), they can read the document's draft/published state to decide. That is how "Publish" disables itself on an unchanged document.

These stories call the real action shape and render what comes back. They do not mount a document footer, a fake footer claiming to be the studio's would assert something you could not check. What is shown is the description, and the rendering beside it is labelled as a stand-in.

> **Why it matters:** an action is a function that returns a description, not a component that returns markup. Reach for that description as the unit of extension, call and spread rather than wrap, and the studio keeps rendering it correctly in every context it can appear.

<!-- @story TheShape -->

The whole contract, on one page. An action is a function; its return value is a plain object; the studio renders it. Compare with `form.components.input`, where you return JSX and the studio renders nothing on your behalf.

<!-- @story ReturningNull -->

There is no `hidden` flag. An action that should not appear **returns `null`**, and the studio renders nothing for it. Toggle the switch below.

That is a stronger contract than a hidden flag, because absence composes: an action list is filtered before rendering, so a null action does not leave a gap, does not affect ordering, and cannot be revealed by CSS. It also means "should this exist?" and "what should it look like?" are the same function call, evaluated against the same document state.

<!-- @story Disabled -->

The other option, and the choice between them is a real design decision the seam leaves to you. `disabled: true` keeps the action visible and inert; returning `null` removes it.

The same tension shows up across the catalog - `CreateReleaseMenuItem` disables with a tooltip, the comments inspector header removes its controls in upsell mode. The rule that reconciles them: **disable when the action exists but is currently unavailable; remove when it does not apply to this document at all.** A disabled control is a promise about the future; an absent one is a statement about the present.
