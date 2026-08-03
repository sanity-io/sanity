---
source: stories/media/Video.stories.tsx
title: 'Forms & Input/Video'
blocks: 1
roundtrip: true
sourceHash: fa78f5b0d938d690
---

<!-- @component -->

The Mux-backed `VideoPlayer`, the actual moving pixels, is deliberately never mounted here: it needs a live playback stream and pulls in `@mux/mux-player-react`. Every story shows the chrome around that stream, which is exactly where the Studio-authored UX lives.

|          |                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/media-library/plugin/VideoInput/*`, Studio-only (no design-system equivalent); a Media Library plugin surface exported via `sanity/media-library`                                                                                                                                                                                                                                |
| Tier     | SERVICE. The video field is a thin seam over two external services: Media Library owns the asset’s identity/storage and Mux owns playback. The field renders an aspect-ratio frame + an actions menu and delegates streaming and asset lifecycle behind a narrow interface (a `media-library:<lib>:<instance>` reference), exactly the decomposition boundary FileInput sits on                       |
| Audit    | ⚪ not-audited (`asset-lifecycle-reuse`). The pattern-library audit exercised the file/image inputs, not this newer video surface; the pattern it sits on is `asset-lifecycle-reuse` (the asset should be a first-class library item, not an attachment trapped in the doc), and one leaf, the loading `Skeleton`, is a small counter-example to the audit’s `skeleton-vs-spinner` blank-pane finding |
| Patterns | `asset-lifecycle-reuse`                                                                                                                                                                                                                                                                                                                                                                               |

The video field an editor meets inside a document form: the frame, the options menu, and the loading and error states around a video that streams from Mux and lives in your Media Library.

Drop a video reference into a document and this is the surface that renders: an aspect-ratio frame with the moving picture inside, plus a three-dots menu to browse, upload, copy the URL, jump to the asset in Media Library, or reset the field. It reads as one component, but it is really a thin seam over two external services, Media Library owns the asset’s identity and storage, Mux owns playback, stitched together behind a single `media-library:<lib>:<instance>` reference. That is the same decomposition boundary FileInput sits on, and it is what keeps the field small while the heavy lifting happens elsewhere.

These stories mount the **real** VideoInput leaves directly. In production `VideoPreview` calls `useVideoPlaybackInfo` (a polled `/playback-info` request) and then renders one of these leaves by state: `VideoSkeleton` while loading or on error, `VideoActionsMenu` once playback resolves, `InvalidVideoWarning` when the ref is not a Media Library video. Rather than stub that network hook, the stories render the leaves it resolves _to_, each is prop-driven and fully offline.

> **Why it matters:** the Mux-backed `VideoPlayer`, the actual moving pixels, is deliberately never mounted here: it needs a live playback stream and pulls in `@mux/mux-player-react`. Every story shows the chrome _around_ that stream (frame, menu, skeleton, warning), which is exactly where the Studio-authored UX lives. An empty frame is the honest no-stream state, not a bug.
