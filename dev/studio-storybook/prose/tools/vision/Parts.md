---
source: stories/tools/vision/Parts.stories.tsx
title: 'Lists & Data/Vision/Parts'
blocks: 1
roundtrip: true
sourceHash: 6a591787304687b8
---

<!-- @component -->

This page exists because the six sibling pages leave three questions implicit: does an empty result look different from one that never ran, does a non-tabular result explain why the CSV button declines, and do the two timing numbers say which is server-reported and which is round-trip. All three turn out to have real, source-verified answers below.

|          |                                                                                                                                                                                                                                                                                                                                                                   |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | twelve exported pieces across three files: seven in `VisionGui.styled.tsx` (`StyledLabel`, `QueryCopyLink`, `InputBackgroundContainerLeft`, `Result`, `TimingsCard`, `DownloadsCard`, `SaveResultLabel`), two in `SaveResultButtons.tsx` (`SaveCsvButton`, `SaveJsonButton`), one each in `DelayedSpinner.tsx`, `PerspectivePopover.tsx`, `VisionGuiControls.tsx` |
| Tier     | SERVICE. Scaffolding for the GROQ playground tool, not content-bearing                                                                                                                                                                                                                                                                                            |
| Coverage | none of the twelve previously had a story of its own; each already renders inside one of the six sibling pages                                                                                                                                                                                                                                                    |

None of these are unused. Where each currently appears:

- `StyledLabel`, `QueryCopyLink`, `PerspectivePopover`: inside `VisionGuiHeader`, on the **Controls** page.
- `Result`, `TimingsCard`, `DownloadsCard`, `SaveResultLabel`, `SaveCsvButton`, `SaveJsonButton`, `DelayedSpinner`: inside `VisionGuiResult`, on the **ResultTree** page (`StyledLabel` appears there too, on the result label).
- `InputBackgroundContainerLeft`: inside the real `ParamsEditor`, on the **ParamsEditor** page. Its query-editor twin only shows up in the full `VisionGui` mount, on **In Context**; the standalone **QueryEditor** page mounts `VisionCodeMirror` directly, without this wrapper.
- `VisionGuiControls`: only inside the full `VisionGui`, on **In Context**. This is its first isolated demonstration.

Two are pure Box/Card wrappers with no behaviour of their own (`Result`, `TimingsCard`, `DownloadsCard`): their state comes entirely from what `VisionGuiResult` hands them as children, so this page hands them the same real children by hand to show what that decision actually produces.

> **Why it matters:** isolating these parts turned up three answers the composed pages never state explicitly: not-run and empty look almost identical, CSV silently declines on a non-tabular result while JSON does not, and the two timing numbers have different sources with no label saying which is which.
