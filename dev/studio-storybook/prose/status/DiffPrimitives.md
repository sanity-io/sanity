---
source: stories/status/DiffPrimitives.stories.tsx
title: 'The Garden of Forking Paths'
blocks: 1
roundtrip: true
sourceHash: 70cb4d9ae916109c
---

<!-- @component -->

These are the six pieces every reviewer reads a change through. A dead prop that no caller wires up is inert risk on its own, but a group that can look empty while still offering to revert changes nobody can see, and a tooltip that says a user is loading when no such user exists, are both things a person acts on mid-review.

|          |                                                                                                                                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/field/diff/components/{DiffString,DiffCard,DiffTooltip,FromToArrow,FieldChange,GroupChange}.tsx`                                                                                          |
| Tier     | CORE. `ChangeResolver` (its own page) dispatches to `FieldChange`/`GroupChange`; everything below those two is drawn with `DiffCard`, `DiffTooltip`, `DiffString`/`DiffStringSegment`, and `FromToArrow`            |
| Audit    | 🟡 needs-work (`change-visibility`, `attribution`). A dead prop shared by two components, a group that can render its shell over zero content, and a tooltip that cannot tell "still loading" from "failed to load" |
| Patterns | `change-visibility` · `attribution`                                                                                                                                                                                 |

Companion to `ChangeResolver` (dispatch) and `DiffFromTo` (the from/to atom): this page is the parts list underneath both. Every story below is built from real documents through `diffInput(wrap(from), wrap(to))` and, for `FieldChange`/`GroupChange`, the real `buildObjectChangeList`, the same functions `ChangeList` and `ChangeResolver` call. Nothing here is a hand-built `Diff` or `ChangeNode` literal.

**The returns, quoted.**

`DiffStringSegment` (three states, `DiffString.tsx:37-75`):

```tsx
if (segment.action === 'added') return <DiffCard as={RoundedCard} disableHoverEffect tooltip={...}><ChangeSegment as="ins" style={{textDecoration: 'none'}}>{text}</ChangeSegment></DiffCard>
if (segment.action === 'removed') return <DiffCard as={RoundedCard} disableHoverEffect tooltip={...}><ChangeSegment as="del">{text}</ChangeSegment></DiffCard>
// unchanged:
return <Card as="span" radius={2} style={{display: 'inline'}}>{text}</Card>
```

`DiffCard` (two states, `DiffCard.tsx:121-132`): `if (tooltip && annotation) return <DiffTooltip ...>{element}</DiffTooltip>`, else the bare `element`.

`DiffTooltip` (`DiffTooltip.tsx:30-38`): re-dispatches on which prop shape it was given (`diff`+`path` vs a pre-resolved `annotations` array) to the same inner renderer. `AnnotationItem` (`:72-115`) is the part that draws one row: `{author && (<UserAvatar .../><Text>{user ? user.displayName : t('changes.loading-author')}</Text>)}`.

`FromToArrow` (`FromToArrow.tsx:15-27`): one return, a `Text` wrapping whichever of two icons `direction` selects.

`FieldChange`/`GroupChange`: each opens with `if (hidden) return null` (`FieldChange.tsx:136`, `GroupChange.tsx:103` inside the memo and again at `:173`), then renders the row (breadcrumb, the resolved diff component, an optional revert button).

**What reading it turned up.**

<details>
<summary><b>`FieldChange.hidden` and `GroupChange.hidden` are dead props: no caller in the codebase ever supplies them.</b></summary>

`ChangeResolver` is the only place either component is constructed (`grep -rn "<FieldChange\|<GroupChange" packages/sanity/src` returns exactly those two call sites), and its own source passes `readOnly` and (for groups) a `data-testid`, never `hidden`:

```tsx
<FieldChange change={change} readOnly={isReadOnly} addParentWrapper={props.addParentWrapper} />
<GroupChange change={change} data-testid={`group-change-${change.fieldsetName}`} readOnly={isReadOnly} />
```

`ChangeResolver` handles hiding itself, one level up, with its own `isHidden` check (`if (isHidden) return null`) before either component is ever called, so the `hidden` branch each one carries is reachable only by a story handing it the prop directly, which is exactly what `HiddenPropUnreachable` below does, labelled as evidence about the code rather than the product. Same shape as `ChangeResolver`'s own unreachable "unknown change type" branch documented on that component's page, a third instance of the same pattern in one small subsystem.

</details>

<details>
<summary><b>A `GroupChangeNode` can carry real, non-empty `changes` and still render nothing visible.</b></summary>

The builder (`buildChangeList.ts:120-133`) never emits an empty group, `if (changes.length < 2) return changes` runs first, so a `GroupChangeNode` always has at least two children by construction. But each child is re-entered through its own `ChangeResolver`, which re-checks `isHidden` independently per child. Mark both fields of a nested object `hidden: true` in the schema (not the group itself) and the group shell, breadcrumb, revert affordance, renders exactly as it does for two visible changes, with nothing inside the list it wraps. `ZeroVisibleChildren` below reaches this with the real builder, no fabricated node.

</details>

<details>
<summary><b>Adding is not distinguished from unchanged by anything except colour.</b></summary>

`DiffStringSegment`'s removed branch renders `as="del"`, which keeps its element's inherited strikethrough; the added branch renders `as="ins"` with `style={{textDecoration: 'none'}}`, the underline `<ins>` would otherwise get is explicitly switched off. So removed carries a real non-colour signal and added does not: an added span differs from a plain unchanged span by background colour alone (plus a hover tooltip, which is not a persistent signal). And that background colour is not even semantic: `DiffCard`'s tone comes from `useAnnotationColor`, which is keyed by author, not by action (`user-color/manager.ts:107-113`, `getAnnotationColor` at `annotations/helpers.ts:22-27`). Two segments by the same author, one added, one removed, render in the identical background and text colour. `ToneIsAuthorNotAction` shows this directly, with the resolved hex values printed as text so the claim does not depend on anyone's colour vision.

</details>

<details>
<summary><b>`DiffTooltip` cannot tell "still loading" from "failed to load" from "no such user".</b></summary>

`AnnotationItem` reads `const [user] = useUser(author)`, discarding the loading flag `useUser` returns alongside the value, so every one of those three states falls through to the identical `t('changes.loading-author')` string forever. `getUser` (`user/userStore.ts:83-99`) itself resolves `null`, not a rejected promise, for both an unknown id and a 403; there is no error path for `AnnotationItem` to have discarded even if it read the second tuple element. `AuthorRecordNeverResolves` below reaches this with a real, unseeded author id against this storybook's own mock client, no custom fetch stub required, because the real store's own `null`-on-miss behaviour is what produces it.

</details>

> **Why it matters:** an added change and a removed change by the same author render in identical colour, distinguished only by underline-off versus strikethrough. The one signal telling a reviewer "this appeared" from "this vanished" is easy to miss.
