---
source: stories/customisation/CustomField.stories.tsx
title: 'Article'
blocks: 4
roundtrip: true
sourceHash: f83de45feaa4228d
---

<!-- @component -->

CustomField is the layer between the form and the input: it carries the label, description, validation message, presence avatars, change indicator, and collapse affordance around whatever renders inside it. A custom input that appears inside a box nobody wrote is the field.

|      |                                                            |
| ---- | ---------------------------------------------------------- |
| Seam | `form.components.field`, typed `ComponentType<FieldProps>` |
| Tier | SERVICE                                                    |

The prop that tells you which layer you are on: `FieldProps.children` is the rendered input. `InputProps` has no equivalent, because there is nothing below an input. If the component you are writing receives `children` that already look like a form control, you are writing a field.

And the giveaway that this layer owns more than decoration: `ObjectFieldProps` carries `collapsed`, `collapsible`, `onCollapse` and `onExpand`. Collapsing an object is a field behaviour, not an input one, so a replaced field on a collapsible object silently removes the ability to collapse it. Story 3 shows that happening.

Same schema, same document, three registrations. This page is the sibling of `Customisation/Custom Input` and uses the same document on purpose.

> **Why it matters:** read this page if you have ever wondered why a custom input appeared inside a box you did not write. That box is the field. Input and field are two separate seams applied in sequence: the field renders the chrome and receives the input as its children. Customise the input and the field still wraps it. Customise the field and the input still renders inside whatever you return. Most confusion about Sanity form customisation is one of these two being mistaken for the other.

<!-- @story Default -->

No customisation. Everything visible here that is not a text box is the field layer: the three titles, the two descriptions, the validation message under Summary, the change-indicator gutter down the left, and the collapse chevron on Credits.

That is a lot of surface for something with no visual identity of its own, which is exactly why it is easy to replace by accident.

<!-- @story Wrapped -->

A field component that prints `level`, `name` and `changed` above `renderDefault(props)`. Everything from story 1 survives underneath.

Note what `level` reveals. The Credits object is a field at level 0, and Author and Editor inside it are fields at level 1, so the badge appears three times for one object. **Field components recurse**, and a studio-wide field registration nests inside itself at every level of the schema. If your chrome has padding or a border, that padding compounds with depth, which is the usual reason a decorated field looks fine on a flat document and wrong on a nested one.

`changed` is the same flag the change-indicator gutter reads, exposed as a plain boolean so a custom field can react to it directly.

<!-- @story Replaced -->

A field that renders `props.children` and a title. Compare against story 1.

**Gone:** the descriptions on Summary and Credits, which were content the schema author wrote and which no longer reach the editor at all. The validation message under Summary, still failing its `max(60)` rule silently. The change indicators. Presence avatars, which would show collaborators on a field in a live studio. And **the collapse chevron on Credits**, so an object the schema explicitly marked `collapsible` can no longer be collapsed.

That last one is the argument for reading this page before replacing anything. The other losses are visible in the render; the collapse one is a capability that simply stopped existing, and nothing in the form reports it.

A replaced field is occasionally right, for a genuinely different chrome such as a side-by-side comparison layout. `props.title`, `props.description`, `props.validation` and `props.presence` are all handed over precisely so a replacement can render them itself, and a replacement that ignores them is a replacement that drops them.
