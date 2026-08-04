---
source: stories/releases/VersionChips.stories.tsx
title: 'Releases/Version Chips'
blocks: 5
roundtrip: true
sourceHash: 4fea85008c1e5c26
---

<!-- @component -->

The chip row is the only place in the studio that shows a document has more than one simultaneous truth, and the states it has to distinguish are unusually dense for one small control.

|          |                                                                |
| -------- | -------------------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/components/documentHeader/` |
| Tier     | SERVICE                                                        |
| Patterns | `visible-system-state`                                         |

The row of chips at the top of a document that names every version of it, published, draft, and one per release, and lets you switch between them. Each chip is a button plus a right-click context menu. Selecting one changes which version of the document the form below is editing.

A chip can be selected or not; locked, because its release is scheduled and its content is frozen; Canvas-linked, meaning the text is being authored somewhere else; paused, for a scheduled draft that has stopped; or disabled outright. Several of those can be true at once. That is a lot of meaning for something the width of two words. The chip leans on tone, a leading avatar glyph and a trailing lock rather than on text; there is no room for text.

A literal that will catch you: the `bundleId` for the two system chips is `published` and `draft`, singular. `useVersionIsLinked` special-cases exactly those two strings and otherwise calls `getVersionId`, which throws on anything else. Passing the plural `drafts`, which is what the perspective system uses everywhere else, crashes the chip.

A behaviour easy to miss: the selected chip scrolls itself into view on mount. On a document in eight releases the row overflows, and without that the version you are editing can be scrolled off screen.

> **Why it matters:** the interface would otherwise show content while hiding which content it is. A control this small is carrying an unusual amount of state, and every one of its behaviours exists to keep that state legible rather than merely present.

<!-- @story States -->

The vocabulary, in one row. Selected carries the release tone as a filled background; unselected is quiet. **Locked** adds a padlock - the release is scheduled, so the content is frozen and editing it means unscheduling first. **Disabled** is a chip you can see but not switch to.

Read them together and the ranking is deliberate: selection is the loudest signal, because it answers "what am I editing", which is the question the row exists for.

<!-- @story Tones -->

The tone comes from the release, through the same `getReleaseTone` the avatar uses - caution for asap, suggest for scheduled, neutral for undecided, default for archived. A chip and its avatar can never disagree about what kind of release they name, because both derive from one function.

<!-- @story ContextMenuItems -->

The row used inside the chip's context menu, and inside every "copy to release" menu. It is a denser thing than the chip: avatar, title, and a second line saying _when_ - "as soon as possible", a relative date, or "undecided".

That second line is why the menu is usable. A list of release names asks you to remember which is which; a list of names with their timing attached does not. The scheduled one also carries a trailing padlock, so a locked target is refused visibly rather than after you pick it.

<!-- @story Overflow -->

Seven chips in a constrained row. This is the state that motivates the `scrollIntoView` on selection: the row scrolls horizontally, and without it the chip you are editing could sit off screen while the form below shows its content.

It is also the state that argues the chip row does not scale indefinitely - past a handful of releases, a row of chips is a scroll container pretending to be a summary.
