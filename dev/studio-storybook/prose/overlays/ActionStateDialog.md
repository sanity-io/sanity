---
source: stories/overlays/ActionStateDialog.stories.tsx
title: 'Overlays & Navigation/Action State Dialog'
blocks: 1
roundtrip: true
sourceHash: 611a3bff2acf603f
---

<!-- @component -->

ActionStateDialog is the one router every document action dialog in Studio passes through: a confirm, a popover, a modal, or a fully custom surface, whichever kind an action requests, this component decides how it reaches the screen. The branch nobody declared is the one a person can get stuck inside, and that defensive fallback is where the audit finding lives.

|            |                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source     | `packages/sanity/src/structure/panes/document/statusBar/ActionStateDialog.tsx`                                                                                                                                                         |
| Tier       | SERVICE. Draws nothing of its own; reads `dialog.type` off a `DocumentActionDialogProps` and hands off to one of four concrete overlay components, each with its own page in this chapter                                              |
| Audit      | 🟡 needs-work (`modal-panel`, `escape-hatch`). The branch for a `dialog.type` no one declared renders with no header, no footer, and no click-outside; if the malformed dialog also lacks `onClose` there is no way to close it at all |
| Patterns   | `modal-panel` · `escape-hatch`                                                                                                                                                                                                         |
| Call sites | `DocumentStatusBarActions.tsx:168` · `ActionMenuButton.tsx:44` · `DocumentActionShortcuts.tsx:72` · `IncomingReferenceDocumentActions.tsx:66`                                                                                          |

This page mounts the component _directly_, one story per return, because the whole argument is what the branches look like next to each other and a given action can only ever be in one of them at a time. Each call site anchors it to whatever button or element triggered the action, so `referenceElement` matters for two of the five branches.

`DocumentActionDialogProps` declares four kinds, `confirm`, `popover`, `dialog`, `custom`, and the component has a branch for every one of them, plus a fifth for `dialog.type === "dialog" || !dialog.type` (an omitted `type` reaches the same `ModalDialog` as an explicit one), plus a sixth, defensive `unknownModal` branch for anything else. Unlike `MemberFieldError` (ledger #72), nothing declared goes unhandled here, the ceiling and the floor match for the typed union. The gap is different: `dialog.type` is a plain string checked at runtime, `DocumentActionDescription` is public API surface a plugin author fills in without a compiler watching, and a value the union does not name is still reachable. That sixth branch is what is thin.

> **Why it matters:** the fallback branch renders the shared dialog shell wired only to the unknown dialog's own close handler, and nothing else. Trace what that does downstream: the close button only renders when a close handler exists, the Escape key handler bails out the same way, and so does the click-outside handler. So if the malformed dialog object happens not to carry a close handler, plausible for a confirm-shaped object with a typo'd type, which carries its own confirm and cancel callbacks but no generic close, the rendered dialog ends up with no header, no footer, no click-outside, and no Escape. Nothing in the type system stops an action from reaching this state, because by the time the dialog's declared type fails every check, it has already been cast away from anything the compiler can watch.

**Per-branch dismissal, traced to source:**

| Branch             | Closes via                                                                                                              | Reaches                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `confirm`          | Escape / click-outside (wired inside `ConfirmPopover`) or the Cancel button                                             | `dialog.onCancel`                                                                               |
| `popover`          | Escape / click-outside (wired inside the local `dialogs/PopoverDialog`)                                                 | `dialog.onClose`                                                                                |
| `dialog` / no type | header close icon, click-outside, Escape (`ModalDialog` passes `dialog.onClose` to both `onClose` and `onClickOutside`) | `dialog.onClose`, footer buttons only if the caller wires them                                  |
| `custom`           | whatever `dialog.component` builds, entirely                                                                            | nothing automatic, `DocumentActionCustomDialogComponentProps` carries no `onClose` field at all |
| fallback           | header close icon / click-outside / Escape, all gated on `unknownModal.onClose` existing                                | `unknownModal.onClose`, or nothing                                                              |

The `custom` row is its own small finding: `ActionStateDialog` wraps `dialog.component` in a bare `DocumentActionPortalProvider` and renders it, full stop, no backdrop, no centering, no dismiss affordance. The default portal element is a plain, unpositioned `div`, so a custom component that does not give itself its own positioning does not float as an overlay; it renders in normal document flow wherever that `div` happens to sit. The **Custom** story below is deliberately unstyled by `ActionStateDialog` to show exactly that: everything visible, including the close button, is the fixture's own doing.
