---
source: stories/releases/ReleaseDialogs.stories.tsx
title: 'Autumn campaign'
blocks: 10
roundtrip: true
sourceHash: 22b6378164ce50ae
---

<!-- @component -->

ReleaseForm writes to local storage as you type, and restores from it on mount, unusual for a form in a modal, and aimed at a specific failure: an editor starts describing a release, gets interrupted, closes the dialog, and comes back to find the text still there.

|        |                                                        |
| ------ | ------------------------------------------------------ |
| Source | `packages/sanity/src/core/releases/components/dialog/` |
| Tier   | SERVICE                                                |

The form an editor fills in to create a release, the two halves it is built from, and the dialog shown when a workspace is misconfigured. `CreateReleaseDialog` is a shell around `ReleaseForm`, which is itself `TitleDescriptionForm` plus a release-type picker. All three are storied, because the pieces are reused elsewhere, the release dashboard edits a title with the same form the create dialog does.

The type picker is the other half of the form, and it is not a preference. Choosing "At time" reveals a date picker and turns the release into something the system will act on; asap and undecided have no date at all. Switching between them changes what the form is asking for. They are radio-style rather than a dropdown.

> **Why it matters:** the cost of persisting to local storage is that the form is not purely a function of its props, mount it twice in one session and the second mount may show what was typed into the first. These stories run against real storage, so a title typed here persists into the other stories on this page. Not a bug in the harness; it is the component.

<!-- @story TitleDescriptionEmpty -->

The two text fields on their own. Both are auto-growing textareas rather than inputs, so a long release description wraps and the field grows into it instead of scrolling sideways - the same treatment the task title field gets, and for the same reason: these are sentences, not identifiers.

<!-- @story TitleDescriptionFilled -->

With content in both fields. Type into them and watch the description grow; the height is recomputed from `scrollHeight` on every change rather than set by a row count.

<!-- @story TitleDescriptionReadOnly -->

An archived or published release cannot be renamed, so the same form goes read-only rather than being replaced by static text. Keeping the field shape means the dashboard does not reflow when a release is archived, and the value stays selectable and copyable - which a paragraph of static text would also give you, but a differently-sized one.

<!-- @story FormAsap -->

The default. "ASAP" is selected and there is no date control at all - not a disabled one, not an empty one. The form asks for exactly what this release type needs and nothing more.

<!-- @story FormScheduled -->

Selecting "At time" reveals a date picker. Switch between the three types and watch the form change shape: this is a control that changes what is being asked, not a value being set. It reads as a segmented choice rather than a select.

The date here is an _intent_, not a schedule - see `ReleaseTime`, which renders it as "Estimated" until the release is actually scheduled.

<!-- @story FormUndecided -->

The third type, and the one most content models leave out. "Undecided" is a first-class answer here rather than an empty date: a release you intend to make but have not scheduled is a real state, and forcing a placeholder date on it would make the overview table lie about when things are going live.

<!-- @story CreateDialog -->

The whole thing: the form in a dialog, with a confirm button that is disabled while the release is invalid. `getIsReleaseInvalid` gates it, so the button reflects the form state rather than letting you submit and then explaining what was wrong.

Submitting runs the real create operation against the mock client, so the outcome here is a harness artifact rather than a behaviour - the states to read are the form and the disabled confirm.

<!-- @story MisconfigurationDialog -->

Shown when the workspace release limits do not make sense - a plan says one thing and the config says another. There is exactly one action, and it is "contact support", because this is not a state an editor or even a developer can fix from inside the studio.

Most error surfaces in this codebase work hard to give the reader something to do; this one correctly concludes there is nothing, and says so in one sentence rather than offering a retry that cannot help.

<!-- @story StorageNote -->

Not a component - a warning worth having in the catalog. `ReleaseForm` restores from local storage on mount, so these stories are not independent of each other and not independent of what you typed a minute ago. Clear the stored draft below if a story looks pre-filled with something you do not recognise.
