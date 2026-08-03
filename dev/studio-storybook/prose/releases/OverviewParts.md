---
source: stories/releases/OverviewParts.stories.tsx
title: 'Releases/Overview Parts'
blocks: 11
roundtrip: true
sourceHash: 0cff875e8fde543a
---

<!-- @component -->

Three of these components render `null` under conditions their props do not mention, and that is the recurring shape of this screen: the overview cannot predict its own layout from its own state, it hands data down and finds out what appears.

|          |                                                    |
| -------- | -------------------------------------------------- |
| Source   | `packages/sanity/src/core/releases/tool/overview/` |
| Tier     | SERVICE                                            |
| Patterns | `empty-states`                                     |

The pieces the Releases overview screen is assembled from: its empty state, its four banners, and the control that switches between releases and scheduled drafts. The overview root itself runs a live query and is out of scope; everything around it is prop-driven and storied here.

`ReleasesEmptyState` returns null in upsell mode. `DraftsDisabledBanner` returns null unless a cardinality-one release actually exists. `ConfirmActiveScheduledDraftsBanner` returns null when the count is zero. Each of those is a decision made from context the caller did not pass in.

So the null cases are storied explicitly below, in dashed frames. "Renders nothing" is a behaviour, and an empty story frame is the only honest way to show it.

> **Why it matters:** each of these components decides for itself, from context the caller did not pass in, whether it has anything worth saying. Check that before you go looking for why a banner did not show up: the absence may be the component working correctly, not a wiring bug.

<!-- @story EmptyState -->

A studio with releases enabled and none created. Illustration, a heading, a sentence, and two actions - and note the second is a link to the documentation rather than a second thing to click in the product.

That is the right call for a feature nobody has used yet. The primary action is passed in as `createReleaseButton` rather than owned by the empty state, so the button carries whatever permission and limit rules apply (see `CreateReleaseMenuItem`) and the empty state does not have to know about any of them.

<!-- @story NotFoundBanner -->

You followed a link to a release that no longer exists. The banner is caution-toned, sits above the table, and is **dismissible** - which is the distinguishing feature. The release is gone and nothing further will happen; the only remaining job is to explain the discrepancy once and then get out of the way.

Contrast the two banners below, which are not dismissible because their conditions persist.

<!-- @story DraftsDisabled -->

Two different configurations produce two different sentences. With scheduled drafts on but drafts mode off, the message names drafts mode; with scheduled drafts off, it names scheduled drafts. Same banner, and the distinction matters because the two are fixed in different places.

<!-- @story DraftsDisabledHidden -->

The same disabled configuration, but with no cardinality-one release in the workspace - so the banner returns `null`.

The logic is `(!isDraftModelEnabled || !isScheduledDraftsEnabled) && hasSingleDocRelease`, and the second half is the interesting one: the warning only appears if there is something to warn _about_. Telling an editor that scheduled drafts are disabled when they have never made one is noise. The banner reads the release list to decide whether its own message is relevant, which is more restraint than most banners show.

<!-- @story ConfirmScheduledDrafts -->

Counts the active cardinality-one releases and offers an action. The count is interpolated through `Translate` rather than concatenated, so a translator gets a whole sentence with a plural rule instead of a fragment plus a number.

The button does two different things depending on where you are: in the paused view with no date filter it opens a confirm dialog, otherwise it navigates to the paused view. One control, two behaviours, and the label changes to match - so the button never promises something it will not do.

<!-- @story ConfirmScheduledDraftsNone -->

No active scheduled drafts, so the banner returns `null` before rendering anything. Storied because the overview screen mounts this unconditionally and lets the component decide - the caller does not gate it.

<!-- @story ViewPickerBoth -->

With both releases and scheduled drafts available, the control is a menu and you can switch. Open it and pick the other view; the label follows.

<!-- @story ViewPickerSingle -->

When only one view is available the component stops being a button and becomes a **label**: an icon and a word, with nothing to click.

This is the good version of a disabled state. A greyed-out menu button would say "there is a choice here you cannot make", which is false - there is no choice, there is one view. Removing the affordance entirely is the honest rendering, and it is a distinction worth copying: disable a control when the option exists but is unavailable, remove it when the option does not exist.

<!-- @story ViewPickerLoading -->

While the release list is still loading the menu button is disabled rather than hidden. Correct here, and the mirror image of the story above: the choice definitely exists, it is just not answerable yet, so the control stays and goes inert.

<!-- @story InContext -->

The pieces assembled the way the overview screen stacks them: the view picker in the header, then whichever banners have decided they are relevant, then the table. Seen together, the banner stack is the screen telling you what is unusual about your current configuration before you start reading rows.
