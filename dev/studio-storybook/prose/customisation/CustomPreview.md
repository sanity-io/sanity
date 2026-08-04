---
source: stories/customisation/CustomPreview.stories.tsx
title: 'Speaker'
blocks: 5
roundtrip: true
sourceHash: d6c2903fea191080
---

<!-- @component -->

A preview receives none of the form node other seams get, no value, no path, no schema type, no change handlers, only `title`, `subtitle`, `media`, `status`, `description` and a `layout`, already resolved. That makes it the odd one out among the seven form seams. Know why before writing one.

|      |                                                                |
| ---- | -------------------------------------------------------------- |
| Seam | `form.components.preview`, typed `ComponentType<PreviewProps>` |
| Tier | SERVICE                                                        |

This is how a document or object is summarised anywhere it appears as a reference to itself rather than as a form: array rows, reference fields, search results, document lists, the pane list. It is a presentation component with no access to the document behind it, deliberately, because the same preview has to render in places where the document is not loaded.

Two traps, both invisible in a story that renders one happy state. First, `title` may be a component, not a node: the type is `ReactNode | ComponentType<{layout}>`, and the same is true of `subtitle`, `media`, `status` and `description`. A caller that needs the value to depend on the layout passes a component and lets the preview call it. A replacement written as `<Text>{props.title}</Text>` renders nothing at all when it is handed one, and React will not warn.

Second, `isPlaceholder` is the loading state. Previews resolve asynchronously against the Content Lake, so a preview renders before its values arrive. The default renders skeletons. A replacement that ignores the flag renders `undefined` for a beat, or permanently if the document is missing.

Layout is a requirement, not a hint. One component is called for `default`, `media`, `detail`, `compact`, and for the Portable Text shapes `block`, `blockImage` and `inline`. A custom preview sized for a document list will be wrong inside a text paragraph. `renderDefault` handles all seven; a replacement handles the ones its author thought of.

The previews visible below are array-row previews, which is `layout="default"`. The other layouts are exercised in Lists & Data/Previews, which stories the default preview components directly at every layout key.

> **Why it matters:** the two traps above are both conditional, and both invisible in a story that renders one happy state against a small, complete, already-loaded document. A replacement that skips them looks correct in exactly the conditions it was developed under.

<!-- @story Default -->

No customisation. Each row shows the title and subtitle the `speaker` type selected, laid out by the default preview for this layout.

The schema said very little: `preview: {select: {title: "name", subtitle: "role"}}`. Everything about the arrangement, the truncation behaviour, the placeholder handling and the media slot came from the default component rather than the declaration.

<!-- @story Wrapped -->

The same previews with `props.layout` printed beside each. The badge reads `default`, which is what an array row asks for.

The badge proves that **the layout arrives as a prop rather than being implied by where the component was registered.** One registration, many shapes. If you open `Lists & Data/Previews` you can see the same set of values rendered at `media`, `detail` and `compact`, and a custom preview registered studio-wide is responsible for all of them.

The decoration itself is trivially safe because `renderDefault` is still doing the work.

<!-- @story ReplacedCarefully -->

A replacement that checks `isPlaceholder` before rendering and guards against `title` arriving as a function. Both guards are three lines and both are the difference between a preview that degrades and one that shows `undefined` to an editor.

What it still gives up, and cannot easily get back: the media slot, the status slot, layout-appropriate sizing across all seven layout keys, and the truncation the default applies so a long title does not break the row it sits in. Those are the parts of a preview that look like nothing until content is real.

Compare against story 1 and the loss is modest here, because this document is small, complete and loaded. That is the shape of the risk with this particular seam: the replacement looks correct in exactly the conditions you develop it under.

<!-- @story ReplacedNaively -->

`<Text>{props.title}</Text>` and nothing else, which is the first thing most people write.

Against this fixture it looks fine, and that is the story. The two failures it carries are both conditional: it renders nothing when a caller passes `title` as a component, and it renders nothing during the placeholder beat before values resolve. Neither reproduces against a small local document that is already loaded.

Storied deliberately as a **negative example**, so the chapter has a rendering of the shape that passes review and fails in production rather than only a description of it. Read it against story 3, where the same replacement is two guards better.
