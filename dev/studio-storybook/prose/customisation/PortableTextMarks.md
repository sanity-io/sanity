---
source: stories/customisation/PortableTextMarks.stories.tsx
title: 'Internal link'
blocks: 6
roundtrip: true
sourceHash: b847ab3508fa68da
---

<!-- @component -->

Annotations, decorators, styles, and list items customise the text of a Portable Text field rather than the objects embedded in it, and all four are schema-level only: none has a workspace-config equivalent, because there is nothing studio-wide to say about a decorator that only exists because a particular field declared it.

|          |                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Seams    | `marks.decorators[].component` (`BlockDecoratorProps`) · `styles[].component` (`BlockStyleProps`) · `lists[].component` (`BlockListItemProps`) · `<annotationType>.components.annotation` (`BlockAnnotationProps`) |
| Tier     | SERVICE                                                                                                                                                                                                            |
| Patterns | `rich-text-editing`                                                                                                                                                                                                |

```ts
{type: 'block',
 styles:  [{title: 'Lead',      value: 'lead',      component: LeadStyle}],
 lists:   [{title: 'Checklist', value: 'checklist', component: ChecklistItem}],
 marks: {
   decorators:  [{title: 'Highlight', value: 'highlight', component: Highlight}],
annotations: [{name: 'internalLink', type: 'object', components: {annotation: Ann}}],
 }}
```

Note the inconsistency in that block, because it is real and it will cost you five minutes. Styles, lists and decorators take a singular `component`. Annotations take a `components` object with an `annotation` key. The reason is that an annotation is a full object type with fields, so it carries the same `components` bag every object type does; the other three are plain title/value pairs with no form behind them.

Anything rendered inside the editor that is not part of the edited text must carry `contentEditable={false}`, and generally `userSelect: none` as well. The checklist below does this on its box glyph. Skip it and the editor counts your decoration as prose, which corrupts the selection and, on paste, the content.

Each story turns on exactly one of the four against an identical document, so the diff is always attributable.

> **Why it matters:** for a block object you decorate by wrapping the default render. For an annotation you generally cannot, because an annotation is a mark on a span rather than a container around one, and inserting an element around the default would put a boundary inside a run of editable text. The move instead is to call the default renderer with a modified prop, passing back a decorated text element rather than wrapping the whole thing. Same principle, inverted mechanics.

<!-- @story Default -->

The schema already declares a `lead` style, a `checklist` list, a `highlight` decorator and an `internalLink` annotation, and **none of them has a component**. Read what the editor does with that.

All four are fully functional: they appear in the toolbar, they apply, they persist to the document, and they round-trip. What they lack is a _rendering_. The lead paragraph looks like a normal one, the highlight is invisible, and the checklist renders with the bullet default.

That is the honest starting point for this page. A custom mark without a component is unstyled, not broken; the seam exists to answer the presentation question only. Note that the annotation is the exception: it gets a default rendering, because unlike the other three it has fields and therefore needs an affordance to open them.

<!-- @story Decorator -->

The `highlight` decorator with a component. `BlockDecoratorProps` is the smallest contract on this page: `children`, `value`, `title`, `focused`, `selected`, `schemaType`, `renderDefault`. No value of its own, no form, no dialog, because a decorator is a boolean on a span.

The component here does not call `renderDefault`, and for a decorator that is usually right rather than a shortcut. There is no default rendering for a decorator the studio did not define, so `renderDefault` has nothing to delegate to. The advice to decorate rather than replace is about seams with a substrate underneath, and this one has none.

<!-- @story Style -->

The `lead` style with a component. The first paragraph now renders larger and semibold.

`BlockStyleProps` gives you `block` (the whole text block, so the renderer can read its children or its `_key`) alongside `children` (the block rendered without this style). The seam is block-level: whatever you return replaces the paragraph container. The guidance in `definitionExtensions.ts` is to reach for `@sanity/ui` primitives rather than hard-coded CSS. A heading styled with a literal `font-size: 24px` stops tracking the studio theme the moment anyone changes it, and Portable Text fields render inside panes of several different widths.

<!-- @story ListItem -->

The `checklist` list with a component. Two items, nested one level apart.

`BlockListItemProps` is the style contract plus **`level`**, and that single extra prop is why the seam is separate. A list marker has to know its depth, both to indent and, for ordered lists, to pick the right numbering scheme. The renderer here multiplies `level` into padding.

This is also the story where the `contentEditable={false}` rule is doing visible work. The box glyph is not text the author typed, and without the attribute the editor would let the caret land inside it.

<!-- @story AllFour -->

Every seam on, which is what a real editorial schema looks like once someone has spent a week on it.

Read this against story 1: the document is byte-for-byte identical in both. Portable Text stores marks, styles and list types as **plain strings** on the block, so none of these components changed what was saved. A schema that drops all four renderers still opens the same content, and a front end rendering it makes its own decisions independently.

That separation is the reason these seams are presentation-only by design rather than by convention, and it is what makes them safe to change later.
