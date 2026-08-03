---
source: stories/customisation/CustomItem.stories.tsx
title: 'Speaker'
blocks: 3
roundtrip: true
sourceHash: fcae291d84b569da
---

<!-- @component -->

A row is its own thing, separate from both the array input and the fields inside it: its drag handle, its preview, its menu, and the affordance that opens it for editing.

|          |                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------- |
| Seam     | `form.components.item`, typed `ComponentType<ItemProps>` and narrowing to `ObjectItemProps` for arrays of objects |
| Tier     | SERVICE                                                                                                           |
| Patterns | `array-editing`                                                                                                   |

Where it sits in the stack: an array field renders an array input, which renders one item per member, and each item renders the object's own fields inside it. So a single array row passes through field (the array's own chrome), then input (the array input), then item (the row), then field and input again for every field inside the row. Four of the seven form seams fire on one row of one array. Check that before registering anything studio-wide.

`ObjectItemProps` carries `collapsed`/`collapsible` and `open`/`onOpen`/`onClose`, and they are not the same mechanism. Collapsing shows or hides the row's fields in place. Opening puts them in a dialog. Which one an array uses depends on its `options`, and a replacement that wires only one of them will feel broken in arrays configured for the other.

Arrays of primitives do not come here. `tags` in the document below is `array of string`, and its rows go through `ItemProps` rather than `ObjectItemProps`: no `open`, no `collapsed`, no preview, because there is no object to preview. Story 2 shows both arrays under one registration so the difference is visible rather than described.

> **Why it matters:** a row is not the same thing as its contents. Two mechanisms live on this seam that look interchangeable and are not, collapsing a row in place and opening it in a dialog, and a replacement that wires only one will feel broken in arrays configured for the other.

<!-- @story Wrapped -->

A row number to the left of `renderDefault(props)`, taken from `props.index`. The drag handle, the preview, the menu and the validation marker on row three all survive.

**Look at the tags array underneath.** The same component is numbering those rows too, because `form.components.item` is studio-wide and applies to every array of every kind. It happens to work here, but the component is typed `ObjectItemProps` and a primitive row does not carry `changed`, `open`, or `collapsed`. A studio-wide item component that reads any of those against a primitive array reads `undefined`.

The fix is the same as everywhere else in this chapter: register on the type, or branch and delegate.

Ordinal numbering is also a genuinely reasonable thing to want here, since an array is ordered and the default does not say so anywhere.

<!-- @story Replaced -->

Rows drawn from `props.value`, no `renderDefault`. Compare against story 1.

**Gone:** the drag handle, so an ordered array can no longer be ordered. The row menu, so rows cannot be removed or duplicated. The validation marker on row three, whose missing `role` is now invisible at every level the author can see. And the click target that opens the row, so **the fields inside these rows can no longer be reached at all**.

That last point is the one to sit with. Unlike a replaced input, which at minimum still renders something the author can type into, a replaced item can silently make its own contents unreachable. `props.onOpen` and `props.open` are handed over so a replacement can present that itself, and a replacement that forgets them produces an array of read-only cards that look deliberate.

Note the tags array below is unaffected in the ways that matter, because primitive rows have less to lose.
