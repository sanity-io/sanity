---
source: stories/status/RevertChanges.stories.tsx
title: 'Lists & Data/Revert Changes'
blocks: 1
roundtrip: true
sourceHash: c3ecc0baec0e4ac4
---

<!-- @component -->

This is a destructive action, it discards edits with no separate undo, gated by exactly the two things a person cannot see: a permission they may not know they lack, and a document-pair resolution they have no visibility into. When it fires, the confirmation names a count and nothing else.

|          |                                                                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/{RevertChangesButton,RevertChangesConfirmDialog}.tsx`                                                    |
| Tier     | CHROME. The undo action attached to every field and group change in Review Changes, never a change renderer itself                                       |
| Audit    | 🔴 needs-work (`destructive-friction`). The confirmation never says what is about to be lost, and the disabled button gives no reason for being disabled |
| Patterns | `destructive-friction`                                                                                                                                   |

The two pieces behind "revert this change": a bleed button that only reveals its red, labelled state on hover, and the confirm popover it opens.

Both are real callers, not a hypothetical pairing: `FieldChange.tsx` renders `<RevertChangesButton changeCount={1} disabled={readOnly || !isTargetReady} .../>` beside every single field change, and `GroupChange.tsx` renders the same button with `changeCount={changes.length}` beside a whole fieldset. Each wires its `onClick` to open a `RevertChangesConfirmDialog` anchored to the button.

**What reading it turned up.**

<details>
<summary><b>`RevertChangesConfirmDialog` does not say what is about to be lost, it just asks yes or no.</b></summary>

Read the message it builds: `changeCount > 1 ? t('changes.action.revert-all-description', {count}) : t('changes.action.revert-changes-description', {count})`. The actual strings (`core/i18n/bundles/studio.ts`) are "Are you sure you want to revert all {{count}} changes?" and "Are you sure you want to revert the change(s)?", a bare count, no field names, no before/after values, nothing about what the reverted change contained. Reverting a group of five changes and reverting a group of five different changes produce the identical dialog, because the dialog only ever knows the group's size. It is a yes/no with a number attached, not a description of the loss.

</details>

<details>
<summary><b>`RevertChangesButton` has a disabled state, but it never explains itself.</b></summary>

Both real callers pass `disabled={readOnly || !isTargetReady}`: reverting is blocked while the target document pair is not resolved, or the field is read-only. But not by omission: `RevertChangesButton.tsx` hardcodes `tooltipProps={null}` on every render, unconditionally, so no caller can ever attach an explanation even if one is passed in. A disabled revert button in Studio gives zero indication of why it cannot be used, not "still loading," not "read-only," nothing.

</details>

> **Why it matters:** two different silences bracket one action that erases work. The button that cannot be clicked will not say why, and the dialog that can be confirmed will not say what.
