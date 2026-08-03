---
source: stories/customisation/PortableTextBlocks.stories.tsx
title: 'Stock ticker'
blocks: 5
roundtrip: true
sourceHash: c85364a70ae5700b
---

<!-- @component -->

Portable Text ships a handful of default members, paragraphs, headings, lists, a link annotation, and everything past that is a type an author defines. The editor has to be told how to draw it through one seam every block in the array arrives at, rather than through a registry of renderers keyed by type name.

|          |                                                                                                                                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seams    | `components.block` and `components.inlineBlock`, both typed `ComponentType<BlockProps>`, available at two levels: the workspace config (`form.components.block`) and a schema type’s own `components.block` |
| Tier     | SERVICE                                                                                                                                                                                                     |
| Patterns | `rich-text-editing`                                                                                                                                                                                         |

How a user-created Portable Text member gets rendered inside the editor: one schema, one document, four registrations below.

The distinction that decides your code is which of the two levels you register at, and it is not a matter of taste. On the type (`productCard.components.block`) the renderer sees only that type; this is what you want almost always. On the config (`form.components.block`) the renderer sees every block in every Portable Text field in the studio, including plain paragraphs. `Compositor.tsx` passes the same `renderBlock` to `TextBlock` that it passes to block objects, so a studio-wide block component wraps the prose too. Story 3 shows this happening.

That asymmetry catches people because the analogous input seam behaves the same way and is equally surprising there. The fix is the same in both places: register on the type, or branch on `props.schemaType.name` and return `props.renderDefault(props)` for everything you did not mean to touch.

A block object has no default of its own to fall back on beyond its preview. `renderDefault` for a `productCard` draws the preview, the drag handle, the context menu and the open-for-edit affordance. That is a smaller default than a text block gets, but it is the entire interaction model for the block. Read story 5 before you replace one.

> **Why it matters:** register on the type unless a treatment genuinely belongs on every block everywhere. A studio-wide registration on the config seam wraps the prose as well as the custom objects, and that surprise is the single most common way this seam goes wrong.

<!-- @story Default -->

No component registered anywhere. Both `productCard` blocks render through the default: the schema `preview` supplies the title and subtitle, and the block carries a drag handle, a context menu and a click target that opens its fields for editing.

Note the second card. It has no `price`, which its schema marks `required()`, and the default surfaces that as a validation marker on the block itself rather than only at the field level. That marker is the thing most easily lost, so it is the thing to watch across the next three stories.

The `$ACME` pill in the first paragraph is the inline object, also rendering through its preview.

<!-- @story StudioWide -->

The identical decoration pattern, moved to `form.components.block`. Every block is now framed, **including the two paragraphs**, and the badge prints `props.schemaType.name` so you can read what actually arrived at the seam: `block`, `productCard`, `block`, `productCard`.

This is not a bug and it is not a special case. `Compositor.tsx` hands the same `renderBlock` callback to `TextBlock` as it hands to block objects, so a studio-wide registration is a registration over the prose as well. If you came here wanting to style one custom type and reached for the config seam because it was the one you found first, this is the result.

The legitimate use of this seam is a treatment that genuinely should apply to everything: a debug outline, a per-block comment affordance, a change indicator. For one type, use story 2.

<!-- @story InlineBlock -->

The `$ACME` ticker rendered by its own `components.inlineBlock`, which takes the same `BlockProps` as a block object does. The seam is separate because the constraint is: an inline object sits inside the text flow, so its container has to be inline or it breaks the line it lives on.

**The rule that is easy to miss:** anything you render inside a Portable Text editor that is not editable text must be marked `contentEditable={false}`, or the editor treats it as part of the prose and the selection model goes wrong. A plain badge like this one is small enough not to show the symptom; a custom block containing a form field is not, and the `BlockAnnotationProps` docblock in `blockProps.ts` says so explicitly.

Note what this pill gave up by not calling `renderDefault`: it is clickable to open, because `props.onOpen` was wired manually, but there is no keyboard affordance and no context menu.

<!-- @story Replaced -->

A `productCard` renderer that draws the authored values itself and never calls `renderDefault`. Compare it against story 1 card for card.

**Gone:** the validation marker on the second card, which is missing its required `price` and no longer says so anywhere in the editor. The drag handle, so the block cannot be reordered. The context menu, so it cannot be duplicated or deleted from the block itself. The click-to-open affordance, so **its fields can no longer be edited at all** unless the component wires `props.onOpen` and renders `props.open` itself.

That last one is the difference between this seam and the input seam. A replaced input still renders an editable control because the replacement author writes one. A replaced block object renders authored data, and the editing surface for that data lives behind `open` / `onOpen` / `onClose`, which are props rather than markup. Skip `renderDefault` here and you have to rebuild a dialog, not a text field.

There is a real case for it, which is a block whose whole point is a bespoke editing surface. It is a larger commitment than it looks from the outside.
