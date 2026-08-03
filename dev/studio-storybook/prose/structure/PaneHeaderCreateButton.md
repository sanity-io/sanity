---
source: stories/structure/PaneHeaderCreateButton.stories.tsx
title: 'Document Pane/Pane Header Create Button'
blocks: 1
roundtrip: true
sourceHash: b7881c4422c1ce7e
---

<!-- @component -->

This page was first written claiming that a mistyped template id makes the create button quietly disappear. That was wrong, and the story is what proved it: a bad id does not degrade the button, it fails the whole subtree around it.

|          |                                                                                                |
| -------- | ---------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/structure/components/paneHeaderActions/PaneHeaderCreateButton.tsx`        |
| Tier     | SERVICE. It decides between four presentations of one affordance and draws none of them itself |
| Audit    | 🔴 broken (`empty-state`, `permission-gate`)                                                   |
| Patterns | `empty-state` · `permission-gate`                                                              |

This is the plus button in a list pane header. Its whole job is to answer what can be created here, and the answer comes from the structure builder as a list of initial value templates.

This page was the last component in its tier to get a story, and it was blocked on scaffolding rather than on the component itself: it calls a hook that resolves a grants store the shared harness did not seed. Until that existed, every permission branch was unreachable from a story and the live hook would sit unresolved forever, reading as a component that renders nothing rather than one that is waiting. The harness now seeds it.

The four returns, quoted:

| Line | Condition                    | Renders                                        |
| ---- | ---------------------------- | ---------------------------------------------- |
| 86   | `templateItems.length === 0` | `null`                                         |
| 88   | `nothingGranted`             | one disabled button with a permissions tooltip |
| 108  | exactly one template         | a direct `IntentButton` straight to that type  |
| 134  | more than one                | a `MenuButton` listing every template          |

Plus a fifth exit hiding inside the third: an item with no resolvable intent also returns nothing.

The failure happens upstream, in template-permission resolution, which looks up the template by id and throws when nothing matches. That throw lands inside an observable pipeline stage and gets re-thrown during render, where it propagates to the nearest error boundary. The unresolvable-template story below shows the throw, caught by a local boundary so the page can render it.

The same file handles a softer failure carefully: when an item's own initial value fails to resolve, it deliberately stays creatable and defers the error to the editor, to avoid a misleading insufficient-permissions state for what is really a resolution failure. Resolution failures were thought about. The missing-template case three lines below throws unguarded.

On the permissions branch: full denial requires that every template be ungranted. Three of four ungranted still renders the full menu, with the three disabled individually and explaining themselves through a tooltip. That is the right call. The all-or-nothing case next to it collapses to a single unlabelled disabled button that no longer says what would have been created.

While permissions load, every item renders disabled and then flips once the request resolves. The tooltip can suppress itself during that wait, but the disabled styling is not suppressed.

> **Why it matters:** documenting a claim, testing it, and finding it wrong is exactly what this catalog is for. The story disproved the page's own first draft, and the finding underneath, that a bad template id crashes rather than quietly hides, is the more serious defect of the two.
