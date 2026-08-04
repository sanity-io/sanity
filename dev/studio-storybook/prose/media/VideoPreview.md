---
source: stories/media/VideoPreview.stories.tsx
title: 'Article'
blocks: 1
roundtrip: true
sourceHash: 4e02c903515d00c2
---

<!-- @component -->

VideoPreview is the dispatcher every bound video field passes through before anything decides what to show: a skeleton, an error, or the resolved player chrome.

|          |                                                                                                                                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `packages/sanity/src/media-library/plugin/VideoInput/VideoPreview.tsx`                                                                                                                                     |
| Tier     | SERVICE. The dispatcher every bound video field passes through before anything decides what to show: a skeleton, an error, or the resolved player chrome                                                   |
| Audit    | 🔴 needs-work (`change-visibility`, `error-recovery`). Three genuinely different failure situations, and one loading situation with two other real causes, collapse onto screens that cannot be told apart |
| Patterns | `change-visibility` · `error-recovery`                                                                                                                                                                     |
| Returns  | 6, quoted below                                                                                                                                                                                            |

Given a bound `sanity.video` field value, decides whether the ref is even well-formed, then dispatches on the state of a live `/playback-info` fetch: still loading, fatally errored, successful-but-empty, or resolved. Six returns, quoted from the file:

```tsx
if (!asset) return null
if (parseError) return <VideoSkeleton error={parseError} />
if (playbackInfoState.isLoading) return <VideoSkeleton />
if (playbackInfoState.error) return <VideoSkeleton error={playbackInfoState.error} retry={playbackInfoState.retry} />
if (!playbackInfoState.result) return <VideoSkeleton />
return <VideoActionsMenu {...videoActionsMenuProps}><ActionsMenu ... /></VideoActionsMenu>
```

Every story below runs the REAL `useVideoPlaybackInfo` hook against the REAL `VideoPreview` dispatch; nothing is stubbed. What is controlled is the one REST call the hook makes (`client.request({uri: '.../playback-info'})`), using the mock client's own `requests`/`requestCallback` seam (`packages/sanity/test/mocks/mockSanityClient.ts`) rather than a fabricated backend, the same mechanism the rest of this storybook already trusts for every other client-backed story.

**Answering the four questions this page was asked.**

<details><summary><b>Still processing vs. failed vs. deleted vs. network failure: four situations, effectively two appearances.</b></summary>

"Still processing" (Media Library asset `state: "processing"`, polled for up to 2 minutes via `pollForReadyState`) never surfaces as its own screen: the poll runs silently while `playbackInfoState.isLoading` stays `true` the whole time (`startWith(loadingState)` fires once, nothing re-emits mid-poll), so it is the bare `<VideoSkeleton />`, identical to the very first instant of loading. "Failed to process" (`doc.state` is anything other than `"ready"`/`"processing"`), "deleted" (the asset document is not found at all, see the `DeletedOrMissing` story, whose own error message claims to be retrying and is not), and a genuine network failure fetching `/playback-info` (any non-404 rejection) all land in the SAME branch, `playbackInfoState.error`, with the SAME critical-toned card and Retry button, distinguished only by whatever raw `Error.message` string happens to have been thrown. None of the three has a curated, translated message; `VideoSkeleton`'s one translated string (`video-error.description`) is reached only when `error.message` is falsy, which none of the errors this file constructs are (see `NoMessage` below for the one case that does reach it).

</details>

<details><summary><b>No poster or thumbnail state exists in this component at all.</b></summary>

The playback-info response carries `thumbnail`, `animated` and `storyboard` URLs (with their own signed tokens via `getPlaybackTokens`), but nothing in `VideoPreview`, `VideoActionsMenu` or `VideoSkeleton` reads any of them. The only "before playback" surface `VideoPreview`'s own chain renders is `VideoActionsMenu`'s `React.lazy` `<Suspense fallback={<VideoSkeleton aspectRatio={...} />}>` while the `VideoPlayer` chunk itself downloads, a THIRD situation sharing the bare-skeleton appearance from the previous finding, this time for "the code to play the video has not arrived yet" rather than "the video itself has not arrived yet". Whatever a viewer sees before a frame decodes belongs entirely to `@mux/mux-player-react`'s own internal behaviour (it does receive `tokens.thumbnail`/`tokens.storyboard`), which is outside this codebase and not traced further here.

</details>

<details><summary><b>Nothing indicates duration or size before commit-to-load, and for duration this is not a rendering gap: the data is fetched and then never read.</b></summary>

`VideoPlaybackInfo.duration` (seconds) is set from every resolved response and never referenced anywhere else in `VideoInput/` (grepped: zero other hits). `ActionsMenu` (the shared menu this component reuses from the file-input family) offers upload/browse/download/copy-url/open-in-source/reset and nothing else: no length, no dimensions. Size is not even modelled: unlike image assets, `VideoPlaybackInfo` has no size field at all. A person decides whether to open a video with strictly less information than they get for an image.

</details>

<details><summary><b>A genuinely new instance of the pattern this series keeps finding, but sharper than the others.</b></summary>

`if (!playbackInfoState.result)` (line ~293) looks, from the hook's own declared return type (`VideoPlaybackInfoLoadable`), like the same shape of dead branch as `MemberField`'s `return null` or `ChangeResolver`'s unknown-type fallback: the type only produces an unpopulated `result` when `isLoading` is true or `error` is set, both already excluded above it. But this one is NOT dead: `EmptyResult` below reaches it for real, by having the REST call succeed with a `null` body. TypeScript's type is a compile-time promise about what `client.request<VideoPlaybackInfo>()` returns; nothing in this file checks the response against it at runtime. So the branch fires exactly when it should be structurally impossible to, and when it does fire it renders BYTE-IDENTICAL markup to plain loading, the one branch in this whole series that is simultaneously reachable, real, and indistinguishable from something else.

</details>

> **Why it matters:** an editor who sees the bare skeleton has no way to know whether to wait two seconds or two minutes, and an editor who sees the error card has no way to know whether Retry will work (a real network blip), is pointless (the asset is gone), or needs someone else's attention (processing failed at the source): three remedies, one screen.
