---
source: stories/forms/ImageAndFileInternals.stories.tsx
title: 'Document with a file'
blocks: 1
roundtrip: true
sourceHash: 866ab89de1f07493
---

<!-- @component -->

An author looking at a spinner in these fields cannot tell whether it is still loading or silently broken forever, and cannot tell a private asset from one whose access status was never checked; both read as the same blank.

|          |                                                                                                                                                                                                                                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source   | `packages/sanity/src/core/form/inputs/files/common/`, `.../files/FileInput/`, `.../files/ImageInput/` (`ActionsMenu`, `FileActionsMenu`, `FileSkeleton`, `InvalidFileWarning`, `ImageAccessPolicy`, `ImageActionsMenu`, `ImagePreview`, `InvalidImageWarning`)                                                           |
| Tier     | SERVICE, with one CORE-adjacent exception. Everything here is the asset-service chrome shared by both fields (menus, access badges, skeletons, warnings); the exception is `ImageInputHotspotInput`, which owns the proprietary hotspot/crop editor and is CORE-adjacent for the same reason Forms & Input/ImageInput is |
| Audit    | 🟡 needs-work (`asset-preview-loading`). Continues the loading-state audit Forms & Input/AssetPreview ran on the search-filter asset preview, this time on the field inputs themselves                                                                                                                                   |
| Patterns | `asset-preview-loading`                                                                                                                                                                                                                                                                                                  |

The pieces the whole-field pages (Forms & Input/FileInput, Forms & Input/ImageInput) assemble into a working input: the access badge, the actions menu, the wait placeholder, the invalid-reference warning, the stale-upload banner, and (image only) the hotspot dialog.

File and image read as siblings from the whole-field pages: same drop target, same asset-service seam. Taken apart, they diverge in ways those pages have no room to show. `FileActionsMenu` bakes the file's identity, filename and size into the same card that triggers its menu; `ImageActionsMenu` is a bare floating toolbar with no identity in it at all, the pixels carry the identity and the access badge is a third, independently positioned component. `ImageAccessPolicy` only draws for one of its four declared inputs (`private`); `public`, `unknown` and `checking` are the same empty box. And `ImagePreview`, handed a source that fails to load, only tells the author about it when `accessPolicy` happens to be `unknown`; the same failure under the default `public` policy leaves the loading spinner running forever.

Mocking boundary: everything here mounts the real component. `FileActionsMenu`, `ImageActionsMenu`, `ImageAccessPolicy`, `ImagePreview`, `InvalidFileWarning` and `InvalidImageWarning` are driven directly with hand-supplied props, each one is a renderer of a fact something else already decided (an access policy, a menu-open flag, a broken src). The dispatch, dangling-reference, stale-upload and hotspot-dialog stories go through the real `FormBuilderHarness` instead, so the branch is reached the way the field reaches it, not asserted by hand.

> **Why it matters:** an author looking at a spinner cannot tell whether it is still loading or silently broken forever, and cannot tell a private asset from one whose access status was never checked. Both read as the same blank.
