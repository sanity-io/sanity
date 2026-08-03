---
source: stories/releases/ReleaseTitle.stories.tsx
title: 'Releases/Release Title'
blocks: 7
roundtrip: true
sourceHash: 822f2cc61fbcd5fb
---

<!-- @component -->

Truncation here is done in JavaScript at a character count, not in CSS with an ellipsis, and that is a deliberate trade, so know which way it cuts before you reach for it elsewhere.

|        |                                                                 |
| ------ | --------------------------------------------------------------- |
| Source | `packages/sanity/src/core/releases/components/ReleaseTitle.tsx` |
| Tier   | CHROME                                                          |

This is the one place a release title is rendered, so that truncation and the fallback for an untitled release behave identically everywhere. It does three small things and nothing else: substitute a fallback when the title is absent, truncate past 50 characters, and attach a tooltip carrying the full title when, and only when, it truncated.

The win of counting characters in JavaScript is that the component can tell whether it truncated, and so can attach a tooltip only when there is something hidden to reveal, a CSS ellipsis cannot do that, so interfaces built that way either tooltip everything or tooltip nothing. The cost is that the cut is blind to the actual rendered width: at 50 characters it fires the same in a wide dashboard header as in a narrow menu, so a title can truncate with room to spare, or overflow its container without truncating at all if the container is narrow enough.

The `children` render prop exists for call sites that need their own markup around the text but still want the shared truncation and tooltip decision, the version chips use it to fit the title into a chip.

> **Why it matters:** a character-count truncation can tell you whether it cut anything, and a CSS ellipsis cannot. That is what makes a tooltip that appears only when something is actually hidden possible at all, at the cost of a cut that ignores the real rendered width of the container it sits in.

<!-- @story Default -->

Under the limit, so it renders as plain text with no tooltip attached. Edit the title in the controls and watch the tooltip appear once you pass 50 characters.

<!-- @story Truncated -->

Past the limit. The visible text is cut and a tooltip carries the whole thing - hover it. The tooltip is the recovery path for information the layout removed, which is the correct use of one: nothing here is unavailable, only folded away.

<!-- @story TooltipDisabled -->

The same truncation with `enableTooltip: false`, and the full title now has nowhere to go. Call sites use this when the surrounding surface already shows the title in full, or when the component sits inside something that owns hover itself - a menu item, where a nested tooltip would fight the parent.

<!-- @story CustomTextProps -->

The default render is a plain `<Text>`, and `textProps` passes straight through to it. This is how one component serves a dashboard heading and a menu row without either one reimplementing the truncation rule.

<!-- @story RenderProp -->

The escape hatch: `children` receives `{displayTitle, fullTitle, isTruncated}` and returns whatever the call site needs. The component still decides whether to wrap the result in a tooltip, so a caller gets custom markup without having to re-derive the truncation. Here the render prop appends a badge that only appears when something was cut.

<!-- @story InContext -->

Four releases in a narrow list, one of them over the limit. The truncation is what keeps the rows the same height and the layout stable, which is the actual job: a list where one row grows to three lines because someone wrote a descriptive title is a list that is hard to scan.
