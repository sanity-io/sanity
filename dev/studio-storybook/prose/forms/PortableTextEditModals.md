---
source: stories/forms/PortableTextEditModals.stories.tsx
title: 'Callout'
blocks: 1
roundtrip: true
sourceHash: 0eb473274f02156b
---

<!-- @component -->

An editor who opens something inside rich text, a block-level object, an inline object, or a link mark, lands in one of two edit surfaces, and which one they get tracks where in the document tree the thing sits, not what kind of edit they are making. Four small files make that call, and one of the two surfaces they can choose between is functionally dead in a real Studio session.

|          |                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/form/inputs/PortableText/object/modals/{ObjectEditModal,AnnotationObjectEditModal,DialogModal,PopoverModal}.tsx`                                                                |
| Tier     | SERVICE. Decides whether an edit surface lands in a dialog or a popover, and hosts either one. It carries no content model of its own; the fields inside come from whatever object schema is being edited |
| Findings | 2: the dispatch keys on tree position, not edit kind, and the dialog leaf’s default branch is unreachable in a real Studio session                                                                        |

The chrome an editor lands in when they open something inside rich text: a block-level object, an inline object, or an annotation (a mark on some words, like a link). Four small files do the whole job: `ObjectEditModal` decides dialog vs. popover and dispatches to one; `AnnotationObjectEditModal` is the annotation-specific host that finds the one open annotation and hands it to `ObjectEditModal`; `DialogModal` and `PopoverModal` are the two leaf presentations.

None of this has been storied before, and the reason is structural: these four files sit _between_ the Portable Text editor (`PortableTextInput.stories.tsx`, in this same chapter) and the two general-purpose overlay primitives (`Dialog.stories.tsx`, `PopoverDialog.stories.tsx`, in Overlays & Navigation). This page is the seam: what decides which of those two an editor gets, for which kind of object.

A second finding, upstream of the dispatch itself: the "dialog" default never actually reaches `DialogModal`’s `DefaultEditDialog` in a real Studio session. `FormBuilder.tsx` wraps every document form in `<EnhancedObjectDialogProvider>` unconditionally, with no prop threading a way to disable it, so `ObjectEditModal`’s own fallback branch is unreachable except by mounting it in isolation, as this page does. `DefaultEditDialog` is exactly the "mounts fine, is never mounted" shape the codex warns about (see the storybook-authoring skill’s Navbar / `studio.components.logo` finding): it renders correctly, and nothing in the shipped app ever reaches it.

> **Why it matters:** the dialog-vs-popover choice looks like it tracks "type of edit" (annotation vs. object), but source says otherwise: it tracks where in the tree the thing being edited sits, and that default can be overridden per schema type. A block-level object defaults to the heavier dialog surface; an inline object or an annotation defaults to the lighter popover, and the schema author can flip either with one line.

### The dispatch, from source

`_getModalOption(schemaType)` (`object/helpers.ts:16`) reads `schemaType.options?.modal`: the **schema author’s** explicit choice, if any. `ObjectEditModal` (`ObjectEditModal.tsx:32`) then computes `modalType = schemaModalOption?.type || defaultType`, where `defaultType` is supplied by the **caller** based on structural position: `BlockObject.tsx:446` passes `"dialog"` for a whole embedded block, `InlineObject.tsx:322` and `AnnotationObjectEditModal.tsx:49` both pass `"popover"` for an inline object or a mark on a span. So annotations and inline objects are treated alike by default (both stay light); a block gets the heavier surface by default. Either can be overridden per schema type; `sidenote` and `mentionDialog` below do exactly that, in opposite directions.

For the `"dialog"` outcome specifically, there is a third fork nobody sets from schema: `nestedObjectNavigationEnabled` (`ObjectEditModal.tsx:34`, from the deprecated `useEnhancedObjectDialog()`) picks between the tree-editing `EnhancedObjectDialog` and the plain `DefaultEditDialog`. `FormBuilder.tsx:329` mounts `<EnhancedObjectDialogProvider>` with no props around every document form, which always resolves to `{enabled: true}`, so every "dialog" story below that goes through a real `FormBuilder` renders `EnhancedObjectDialog`, never `DefaultEditDialog`. The isolated story further down mounts `ObjectEditModal` outside any `FormBuilder`, which is the only way left to reach the branch at all.

### Unsaved changes and empty schemas

These modals do not buffer edits for a save/cancel choice. Like the rest of the form builder, every keystroke already patches the real document through the same patch channel, so there is nothing to discard on close, and none of the three `onClose` handlers (`BlockObject.tsx:145`, `InlineObject.tsx:114`, `AnnotationObjectEditModal.tsx:23`) ask. The one exception is silent, not a confirmation: `AnnotationObjectEditModal.tsx:30` calls `isEmptyItem` on close and removes the annotation outright if it holds no value, so an empty link mark disappears with no prompt. Neither an unresolvable schema type nor a fields-less object type gets a distinct state in these four files; an unresolvable type is intercepted further upstream (`formState.ts`'s `INCOMPATIBLE_TYPE` synthesis, `ObjectInputMember`'s territory, out of scope here), and a fields-less object type would render whatever `FormBuilder` renders for zero fields inside whichever chrome `ObjectEditModal` already picked; the chrome itself has no branch for it.
