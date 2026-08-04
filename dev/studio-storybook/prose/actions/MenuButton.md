---
source: stories/actions/MenuButton.stories.tsx
title: 'Actions & Commands/MenuButton'
blocks: 5
roundtrip: true
sourceHash: 084afce52d56d9bb
---

<!-- @component -->

MenuButton is one of the highest-traffic controls in Studio: document actions, the create-document picker and the workspace switcher all live behind one, since a menu is where a product puts everything it could not fit on screen.

|              |                                                                                                                                                                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source       | `packages/sanity/src/ui-components/menuButton/MenuButton.tsx`, the Studio shadow of `@sanity/ui` MenuButton                                                                                    |
| Tier         | CHROME. A menu button is a WAI-ARIA commodity control; the shadow only forces the popover to animate. `Menu` and `MenuDivider` are used raw from `@sanity/ui`                                  |
| Audit        | 🔴 needs-work (`hicks-law`, `choice-overload`, `satisficing`). Studio pickers (create-document, workspace switcher) present as one long flat unordered list with no most-likely-first ordering |
| Illustration | `CurrentFlatMenu` is 15 flat siblings; `RecommendedGroupedMenu` is the same 15 capabilities, 4 in front and the tail in two `MenuGroup` submenus                                               |
| Patterns     | `smart-menu-items` · `action-panel` · `hicks-law` · `choice-overload` · `satisficing`                                                                                                          |

The trigger and the `Menu` are composed by the caller; the shadow takes care of the popover wiring, so the thing opens, animates and dismisses like every other menu in the app.

The menu mounts in a portaled popover on `document.body`, so it is never clipped by the pane that owns it. The pair of `…Menu` stories carries the argument this page is making. Read them together: nothing about the component changes between them, only the order and the chunking of what it was handed.

> **Why it matters:** Fifteen alphabetical siblings is a list somebody declined to design, and it charges every editor a full linear scan on every open. Lead with the handful of most-likely actions and collapse the long tail into `MenuGroup` submenus. Same capabilities, a fraction of the scan cost.

The last story shows it in context: the "…" document-actions menu parked on a real "Anna Karenina" book row.

<!-- @story Placements -->

The menu anchored to its trigger via `popover={{placement}}`. The top row is the complete four-way set of cardinal sides (`top`, `right`, `bottom`, `left`). The bottom row is the `-start` / `-end` alignment pair, which only diverges when the trigger is _wider_ than the menu, so those two triggers are deliberately wide: `bottom-start` pins the menu to the trigger’s left edge, `bottom-end` to its right edge.

<!-- @story KeyboardNavigation -->

Open the menu and use ↑/↓ to move, Home/End to jump, type-ahead to match, Enter to activate, Esc to close. This roving-focus behavior is inherent to `@sanity/ui` `Menu`. The audit’s `keyboard-only` gap is about _global_ command reach (Cmd+K), not this local menu, which already holds.

<!-- @story CurrentFlatMenu -->

Reproduces the audit finding: fifteen sibling items in one undifferentiated column, roughly alphabetical, with the most common action (Edit) buried among rarely-used ones like Archive, Inspect and Export. No chunking and no priority, which is `hicks-law` and `satisficing` in the flesh.

<!-- @story RecommendedGroupedMenu -->

The fix, and nothing about the component changed. The four everyday actions (Edit, Publish, Duplicate, Unpublish) sit at the top in likelihood order, the rarely-used tail collapses into two `MenuGroup` submenus, and the one destructive action is isolated below a divider. Fifteen capabilities either way; only the scan cost moved.

**Submenu placement (ledger finding).** Each `MenuGroup` must be given `popover={{placement: "right-start", …}}`. @sanity/ui `MenuGroup` ships _no_ default flyout placement, so an unconfigured submenu inherits `Popover`’s `placement="bottom"` and opens directly below its own trigger, burying Advanced and Delete beneath the Export flyout. This is the raw default rather than a collision-flip of a cramped canvas: the popover portals to `document.body`, unclipped. The fallback list leads with `left-start` so a truly starved right edge flips to the _other side_ instead of stacking below. Every Studio call site (`FieldActionMenuGroup`, `UploadDropDownMenu`) passes this same shape.
