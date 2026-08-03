---
source: stories/collab/TaskFields.stories.tsx
title: 'To Do'
blocks: 7
roundtrip: true
sourceHash: 8001bf01b4515294
---

<!-- @component -->

A task form is built from individual inputs, and two of them are not really form inputs at all: the status control, the title field, and the confirmation for removing a task.

|        |                                                   |
| ------ | ------------------------------------------------- |
| Source | `packages/sanity/src/core/tasks/components/form/` |
| Tier   | SERVICE                                           |

The task list and sidebar are already storied under CMS Patterns/Tasks. These are the fields inside a single task.

> **Why it matters:** every one of these emits a form patch rather than calling a save. The status control and the title field never touch a document, never know whether one exists, and never decide when to write. That is what lets the same components serve a task being created and a task being edited without a mode flag, and it is why they can be storied at all: hand them a value and an onChange, and they are complete.

**And storying that turned up a bug.** `Title` intends to emit `unset` when you clear it, and instead emits `unset` immediately followed by `set("")`, because the `if (!inputValue)` branch is missing a `return`, so it falls through. The empty string wins. Filed as ledger #56; the story below shows both patches.

<!-- @story Status -->

Two statuses, and that is the whole vocabulary: open and closed. Open it and notice the selected row carries BOTH a pressed state and a trailing checkmark - belt and braces, so the current value survives a theme where the pressed background is subtle.

The trigger shows the status icon alongside the label rather than the label alone, which is what lets the same control read at a glance in a dense task list. Change it and watch the patch below.

<!-- @story TitleEmpty -->

A new task. The field autofocuses **only when empty** (`autoFocus={!value}`), so creating a task puts the cursor where you are about to type while opening an existing one does not steal focus from wherever you were.

It is a `<textarea>` styled to look like a heading, not an `<input>`, so a long title wraps instead of scrolling sideways. The height is recomputed on every change, so it grows as you type. Try it.

<!-- @story TitleFilled -->

Start from a filled title, then select all and delete. Watch the readout: it shows **two** patches, `unset([])` and then `set("")`.

That is a bug, and this story is how it was found. The source reads `if (!inputValue) onChange(unset(path))` with no `return`, so execution falls straight through to the `set` on the next line. The unset is emitted and then immediately overwritten, and the field is written as an empty string - the exact outcome the `if` exists to prevent. Fix: add `return`. Filed as ledger #56.

The distinction matters because `set("")` is present-and-empty while `unset` is absent. A list rendering `title || "Untitled"` cannot tell them apart; a GROQ filter on `defined(title)` very much can.

Separately, and working correctly: newlines are stripped on the way through, so pasting multi-line text into what looks like a textarea still yields a single-line title.

<!-- @story RemoveTask -->

The destructive confirm. It returns `null` when `showDialog` is false rather than rendering a hidden dialog, so the whole subtree - and the focus lock inside it - only exists while it is open.

<!-- @story RemoveTaskPending -->

Mid-delete. The confirm button goes to a loading state and the dialog stays open, which is the honest rendering - the task is not gone yet, and closing early would claim otherwise.

<!-- @story RemoveTaskClosed -->

With `showDialog: false` the component returns `null`. Storied explicitly because "renders nothing" is a decision: the alternative, a mounted-but-hidden dialog, keeps a focus lock and a portalled overlay alive on every task in the list.
