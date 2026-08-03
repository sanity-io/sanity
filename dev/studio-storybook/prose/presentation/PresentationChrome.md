---
source: stories/presentation/PresentationChrome.stories.tsx
title: 'Overlays & Navigation/PresentationChrome'
blocks: 1
roundtrip: true
sourceHash: 1e6cf0455b1fb75d
---

<!-- @component -->

Presentation is the surface where an editor works against a live preview of the actual front end: they click an element on the rendered page and edit the content behind it, right there, side by side. It is one of the most distinctive things Studio does, and one of the hardest to put in a Storybook, because the real tool needs a running frontend in an iframe, state machines, and a live connection to talk to it.

|          |                                                                                                                                                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/presentation/panels/PresentationNarrowTabBar.tsx` + `packages/sanity/src/presentation/PresentationSpinner.tsx`, Studio-only (no DS equivalent)                                                                                                                                                       |
| Tier     | CHROME. These frame the Presentation tool rather than carry content: a narrow-viewport tab bar that swaps the tool's three panes one at a time, and the loading spinner shown before the tool mounts. Neither reads content or a live connection                                                                          |
| Audit    | ⚪ not-audited (`selective-attention`). The pattern-library audit never scored Presentation; the tab bar is the same view-switcher family the audit flagged as banner-blindable on the perspective/variant bar, and as a centered, labelled `TabList` with an explicit selected state it reads more legibly than that bar |
| Patterns | `selective-attention`                                                                                                                                                                                                                                                                                                     |

What you can hold in isolation is its chrome, and that is the two pieces on this page. The narrow tab bar is what the tool folds down to on a small viewport: instead of showing preview, navigator, and structure side by side, it stacks them behind a labelled `TabList` swapped one at a time. Click a tab and the real `onTabChange` fires, the selected state is genuine, and the labels are translated against the real `presentation` i18n namespace (registered above), so these are the shipped strings, not fixtures. The spinner is simply what fills the frame while the tool boots.

> **Why it matters:** the full Presentation tool cannot be mounted in isolation. Without a live frontend in an iframe the chrome paints but frames an empty box, and the connection hangs in a permanent connecting state forever, which is exactly why the recon verdict was chrome-only, and why these two leaves are all that render here.

The page closes **in context**: the two leaves assembled into the tool frame mid-boot, the narrow tab bar above the still-spinning preview pane, exactly the empty box the recon describes.
