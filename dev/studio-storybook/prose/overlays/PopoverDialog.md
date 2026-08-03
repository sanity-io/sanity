---
source: stories/overlays/PopoverDialog.stories.tsx
title: 'Overlays & Navigation/PopoverDialog'
blocks: 1
roundtrip: true
sourceHash: ec8072d403947ae4
---

<!-- @component -->

When an editor clicks to edit something in place, a reference's details, an inline object, this is the surface that opens beside it, and it makes one deliberate trade a person keeps discovering the hard way: there is no way to back out of it except its own close button.

|             |                                                                                                                                                                                                                                                         |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source      | `packages/sanity/src/core/components/popoverDialog/PopoverDialog.tsx`, Studio-only (no design-system equivalent)                                                                                                                                        |
| Tier        | SERVICE. More than chrome: it owns real interaction machinery (portal, a scoped focus trap that still permits clicks into sibling panes, a sticky scrollable header) that inline editing surfaces mount into. Less than core, it holds no content model |
| Audit       | 🔴 needs-work (`escape-hatch`). The source deliberately implements neither Escape-to-close nor click-outside-to-close; the only close affordance is the header ×                                                                                        |
| Patterns    | `modal-panel` · `escape-hatch` · `readable-measure`                                                                                                                                                                                                     |
| Width scale | `0` 320px container, 280px text field (~44ch) · `1` 640px, 600px (~94ch, the stories’ default) · `2` 960px, 920px (~144ch)                                                                                                                              |

PopoverDialog is the middle ground between a menu and a full modal: it portals, traps focus with `react-focus-lock`, and carries a sticky header with a close button, yet it still lets you click into sibling panes outside the portal (handy when its contents link out to a reference that opens to the right).

The stories anchor a live dialog to a trigger button. Open it in dark mode to confirm the portalled surface is themed (org contract §5 portal-theming check). The Recommended story wraps the same real component in an added `keydown` listener so Escape closes it, the fix the component declines to ship, illustrated without forking it.

> **Why it matters:** there is no Escape-to-close and no click-outside-to-close, and that is deliberate (see the standing comment in the source weighing nested-dialog and through-portal cases). The only way out is the header close button, so a reader who reaches for Escape gets nothing, the exact shape of the escape-hatch finding. The Recommended story adds the missing listener at the call site to show the fix.

---

### Width & measure

PopoverDialog shares Dialog's width vocabulary but applies it differently. `width` flows to `PopoverContainer`, which, unlike Dialog's `maxWidth`, sets an _actual_ `width: theme.sanity.container[width]` (with `maxWidth: 100%` so it still shrinks to the viewport). The header (`padding={2} paddingLeft={4}`) and body (`padding={4}`) give ~20px each side, so the readable text field is `container[width] − 40px`, the same measure math as Dialog. At `<Text size={1}>` (13px, avg glyph ≈ 0.49em):

| `width`                   | container | text field | measure |
| ------------------------- | --------- | ---------- | ------- |
| `0`                       | 320px     | 280px      | ~44ch   |
| `1`, the stories’ default | 640px     | 600px      | ~94ch   |
| `2`                       | 960px     | 920px      | ~144ch  |

Same measure principle as Dialog: a text-first popover-dialog should hold body copy to ~45 to 75ch. Where PopoverDialog legitimately goes wide is the _object-edit_ case, `EditPortal` / `EnhancedObjectDialog` pass `width` straight through to mount a form (fields carry their own widths), which is content that earns a wider frame. A prose popover at `width={1}` is the same over-measure defect the Dialog stories document; cap the prose, not the popover.

The width control was dead wiring: every story here previously passed a hard-coded `width` and ignored Storybook args, so the autodocs `width` control changed the arg but nothing re-rendered, cycling `0 → 1 → 2` looked broken, and the only way to see another width was to open a _different_ fixed-width story (the three separate buttons in Widths), meaning close and reopen per step. The Width control story below binds `width` to args on a single live dialog. `@sanity/ui` `Popover` positions with a `ResizeObserver`-backed measure (`useElementSize`), so when the container width changes it recomputes placement and the open dialog resizes in place, pointing to the story wiring, not the component, as the cause. Confirm live in that story by cycling the control with the dialog open.

The page closes _in context_: an inline quick-edit of the _Anna Karenina_ book's title, the focus-trapping edit-in-place surface anchored to the field it opened from, the `object-edit` case that legitimately earns the width.
