import {type SanityClient} from '@sanity/client'
import {type ObjectSchemaType} from '@sanity/types'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useRef} from 'react'

// Real component from a real path (org contract §8): the Media Library plugin internals are
// not surfaced through the `sanity` exports map, same idiom as `stories/media/Video.stories.tsx`.
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {mediaLibraryLocaleNamespace} from '../../../../packages/sanity/src/media-library/plugin/i18n'
import mediaLibraryResources from '../../../../packages/sanity/src/media-library/plugin/i18n/resources'
import {
  type VideoAssetInputProps,
  type VideoPlaybackInfo,
} from '../../../../packages/sanity/src/media-library/plugin/VideoInput/types'
import {VideoPreview} from '../../../../packages/sanity/src/media-library/plugin/VideoInput/VideoPreview'
import {createMockSanityClient} from '../../../../packages/sanity/test/mocks/mockSanityClient'
import {i18next} from '../../lib/i18n'
import {WithStudioProviders} from '../../lib/testProvider'

// `VideoSkeleton`/`InvalidVideoWarning` translate against the `media-library` namespace, which
// the shared Storybook i18next does not carry by default. Same fix `Video.stories.tsx` already
// applies: register the real bundle synchronously so `useTranslation('media-library')` resolves
// actual strings rather than raw keys. Additive, so registering it twice across two story files
// is harmless.
i18next.addResourceBundle('en-US', mediaLibraryLocaleNamespace, mediaLibraryResources, true, true)

/* ── Why this page mounts VideoPreview directly rather than its leaves ──────
   `Video.stories.tsx` already stories `VideoSkeleton`/`InvalidVideoWarning`/`VideoActionsMenu`
   as prop-driven leaves, which is the right call for THOSE components - but it means
   `VideoPreview` itself, the dispatcher that decides WHICH leaf a real playback-info fetch
   resolves to, has never been exercised. That dispatch is this page's whole subject, so it has
   to run the real `useVideoPlaybackInfo` hook, not skip it.

   That hook calls `client.request({uri: '/media-libraries/.../playback-info', ...})` through
   `useClient()`. Rather than fabricate a media backend, this page controls exactly what that ONE
   REST call resolves to, using the mock client's own documented seam
   (`packages/sanity/test/mocks/mockSanityClient.ts`'s `requests`/`requestCallback` options) -
   the same mechanism this whole storybook already trusts for every other client-backed story.
   Nothing here stubs `useVideoPlaybackInfo` itself or reimplements its logic; the request goes
   through the real hook, the real retry/poll pipeline, and the real `VideoPreview` dispatch.
   Each story below supplies its own client (a separate `WithStudioProviders` call per story,
   documented as a supported deviation from the "once per file" default), because the six
   branches below are six different answers to the same REST call. */

const MEDIA_LIBRARY_ID = 'lib_9f2c'
const VIDEO_INSTANCE_ID = 'video-8a1b2c3d'
const ASSET_REF = `media-library:${MEDIA_LIBRARY_ID}:${VIDEO_INSTANCE_ID}`
const PLAYBACK_INFO_URI = `/media-libraries/${MEDIA_LIBRARY_ID}/video/${VIDEO_INSTANCE_ID}/playback-info`

// A real, publicly documented Mux demo asset (used across Mux's own player docs), so the
// Resolved story attempts genuine playback rather than a fabricated id - narrated below, the
// same honest boundary as `Forms & Input/ImageInput`'s CDN pixels: it plays if the environment
// can reach the public internet, and the chrome around it is real either way.
const MUX_DEMO_PLAYBACK_ID = 'DS00Spx1CV902MCtPj5WknGlR102V5HFkDe'

const publicItem = (url: string) => ({url})

const resolvedPlaybackInfo: VideoPlaybackInfo = {
  id: MUX_DEMO_PLAYBACK_ID,
  thumbnail: publicItem(`https://image.mux.com/${MUX_DEMO_PLAYBACK_ID}/thumbnail.jpg`),
  animated: publicItem(`https://image.mux.com/${MUX_DEMO_PLAYBACK_ID}/animated.gif`),
  storyboard: publicItem(`https://image.mux.com/${MUX_DEMO_PLAYBACK_ID}/storyboard.vtt`),
  stream: publicItem(`https://stream.mux.com/${MUX_DEMO_PLAYBACK_ID}.m3u8`),
  duration: 634.2,
  aspectRatio: 16 / 9,
}

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    // `sanity.video` is a global schema type the Media Library plugin registers when
    // `mediaLibrary.enabled` is true - the default in `lib/testProvider.tsx`'s mock workspace
    // config, unchanged here, so no plugin wiring is needed beyond referencing the type by name.
    fields: [{name: 'video', title: 'Video', type: 'sanity.video'}],
  },
]

const boundVideoValue = {_type: 'sanity.video', asset: {_type: 'reference', _ref: ASSET_REF}}
/** Media-library-shaped but malformed: two colon-segments instead of three, so
 * `getMediaLibraryId` throws inside `VideoPreview` itself (its own `parseError` branch) rather
 * than being caught upstream by `VideoAsset`'s looser `isVideoSource` (`startsWith` only). */
const malformedRefValue = {
  _type: 'sanity.video',
  asset: {_type: 'reference', _ref: 'media-library:lib_9f2c'},
}

const noop = () => undefined

/** A stub covering every prop `VideoAssetInputProps` declares that `VideoPreview` itself does
 * not read - it destructures a specific subset (see the source quote below); the rest exist only
 * to satisfy the type. `assetSources: []` keeps the browse/upload menu items empty, which is the
 * honest offline state (no real asset source plugged in) and irrelevant to the branch under
 * study - the dispatch this page is about happens before any menu item is built. */
function buildProps(overrides: {
  value: Record<string, unknown> | undefined
  schemaType: ObjectSchemaType
}): Omit<VideoAssetInputProps, 'menuButtonRef'> {
  return {
    assetSources: [],
    changed: false,
    clearField: noop,
    directUploads: false,
    elementProps: {} as VideoAssetInputProps['elementProps'],
    focused: false,
    hoveringFiles: [],
    isBrowseMenuOpen: false,
    isStale: false,
    isUploading: false,
    onClearUploadStatus: noop,
    onOpenInSource: noop,
    onSelectAssets: noop,
    onSelectFiles: noop,
    onStale: noop,
    path: ['video'],
    presence: [],
    readOnly: false,
    selectedAssetSource: null,
    setHoveringFiles: noop,
    setIsBrowseMenuOpen: noop,
    setIsUploading: noop,
    setSelectedAssetSource: noop,
    validation: [],
    ...overrides,
  } as unknown as VideoAssetInputProps
}

function Harness({value}: {value: Record<string, unknown> | undefined}) {
  const schema = useSchema()
  const articleType = schema.get('article') as ObjectSchemaType
  const schemaType = articleType.fields.find((f) => f.name === 'video')?.type as ObjectSchemaType
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    // `VideoActionsMenu`'s options button is `position: absolute; top: 0; right: 0` - in the
    // real field a `position: relative` wrapper anchors it (`VideoAsset.tsx`); without one here
    // it would pin to the nearest positioned ancestor instead of this card. Same note as
    // `Video.stories.tsx`'s own harness.
    <div style={{maxWidth: 360, position: 'relative'}}>
      {/* The ref goes straight across as a prop rather than through `buildProps`. The real
          component only dereferences it inside callbacks (`onFilePickerCancel`), but handing it
          to a function during render reads as a render-time access. */}
      <VideoPreview {...buildProps({value, schemaType})} menuButtonRef={menuButtonRef} />
    </div>
  )
}

/** One `WithStudioProviders` call per story: each needs its OWN client, because each is a
 * different answer to the same REST request. `createMockSanityClient` returns a structurally
 * partial client - real enough for everything this page exercises but not the full
 * `SanityClient` surface - the same cast `lib/testProvider.tsx` itself uses for its own default
 * mock client. */
function decoratorWithClient(client: ReturnType<typeof createMockSanityClient>) {
  return WithStudioProviders({
    config: {schema: {name: 'storybook', types: schemaTypes}},
    client: client as unknown as SanityClient,
  })
}

const resolvedClient = createMockSanityClient({
  requests: {[PLAYBACK_INFO_URI]: resolvedPlaybackInfo},
})

/** `Promise.resolve(requests[uri] ?? null)` on an unlisted key resolves `null` - a SUCCESSFUL
 * response carrying no playback info. Demonstrates that `!playbackInfoState.result` (line ~293)
 * is reachable at runtime even though the hook's own return TYPE claims `result` is always a
 * populated `VideoPlaybackInfo` once `isLoading` is false and `error` is undefined - the type is
 * a compile-time promise the client response is never checked against. */
const emptyResultClient = createMockSanityClient({requests: {[PLAYBACK_INFO_URI]: null}})

/** Never resolves. Deterministic stand-in for "the request is genuinely still in flight" -
 * covers the true first-load instant, but see the docblock finding: it is visually identical to
 * two OTHER real situations this page does not attempt to reproduce live (the up-to-2-minute
 * "asset is processing" poll, and `VideoActionsMenu`'s own `React.lazy` Suspense boundary while
 * the `VideoPlayer` chunk downloads) - traced from source, not fabricated as a claim. */
const loadingClient = createMockSanityClient()
Object.assign(loadingClient, {request: () => new Promise(() => undefined)})

/** A fatal, non-404 response with a curated `.message` - the "failed to process" situation,
 * with a real, working Retry button (`playbackInfoState.retry` re-triggers the request). Guards
 * `uri` with `?.` because the SAME callback also answers `client.observable.request`, whose real
 * call site (`pollForReadyState`) sends `url`, not `uri` - the mock only reads `opts.uri`, so an
 * unguarded `.includes` would throw on that second, differently-shaped call. */
const failedClient = createMockSanityClient({
  // Cast: the mock's declared `requestCallback` shape is `{statusCode, data}`, but the returned
  // object becomes the rejected value verbatim (nothing unwraps `.data`), so a top-level
  // `.message` - what `VideoSkeleton` actually reads - has to ride alongside `data` rather than
  // inside it. The cast changes only what TypeScript checks here, not what the mock returns.
  requestCallback: (({uri}: {uri?: string}) =>
    uri?.includes('playback-info')
      ? {
          statusCode: 500,
          data: undefined,
          message: 'The Media Library reported this video failed to process.',
        }
      : undefined) as unknown as NonNullable<
    Parameters<typeof createMockSanityClient>[0]
  >['requestCallback'],
})

/** A fatal response with NO `.message` - `VideoSkeleton` falls back to its one translated string
 * (`video-error.description`) only in exactly this situation, so this is the story that proves
 * that fallback is reachable at all, distinct from every genuinely dead branch this series has
 * been tracking. */
const noMessageClient = createMockSanityClient({
  requestCallback: ({uri}) =>
    uri?.includes('playback-info') ? {statusCode: 500, data: undefined} : undefined,
})

/** A 404 on the initial request. `isPlaybackNotFoundError` sends this into
 * `pollForReadyState`, which polls `/media-libraries/.../doc/...` for the asset's processing
 * state - unmocked here, so it resolves `null`, `pollForReadyState` sees no document and throws
 * `Asset document video-8a1b2c3d not found, retrying...`. The inner `retryOperator` only
 * intercepts `AssetProcessingError` (the "still processing" signal); a plain `Error` is
 * rethrown immediately, so despite its own wording this situation is NOT actually retried - it
 * reaches `VideoSkeleton` as a normal fatal error, Retry button included, on the first attempt.
 * Zero extra client plumbing needed: this is what the real polling logic does on its own once
 * the first request 404s. */
const deletedOrMissingClient = createMockSanityClient({
  requestCallback: ({uri}) =>
    uri?.includes('playback-info') ? {statusCode: 404, data: undefined} : undefined,
})

const meta: Meta = {
  // Was 'Media/VideoPreview', which made this one file a top-level group of its own. It is the
  // Media Library plugin's video asset input, its props are `VideoAssetInputProps`, and its own
  // sibling `Video.stories.tsx` was already titled 'Forms & Input/Video'. A group of one that
  // sorts to the bottom of the sidebar is not a chapter, it is a file that was named differently
  // from its neighbours. Retiring the 'Media' group entirely.
  title: 'Forms & Input/VideoPreview',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'VideoPreview is the dispatcher every bound video field passes through before ' +
            'anything decides what to show: a skeleton, an error, or the resolved player chrome.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/media-library/plugin/VideoInput/VideoPreview.tsx` |',
          '| Tier | SERVICE. The dispatcher every bound video field passes through before anything decides what to show: a skeleton, an error, or the resolved player chrome |',
          '| Audit | 🔴 needs-work (`change-visibility`, `error-recovery`). Three genuinely different failure situations, and one loading situation with two other real causes, collapse onto screens that cannot be told apart |',
          '| Patterns | `change-visibility` · `error-recovery` |',
          '| Returns | 6, quoted below |',
          '',
          'Given a bound `sanity.video` field value, decides whether the ref is even ' +
            'well-formed, then dispatches on the state of a live `/playback-info` fetch: still ' +
            'loading, fatally errored, successful-but-empty, or resolved. Six returns, quoted ' +
            'from the file:',
          '',
          '```tsx',
          'if (!asset) return null',
          'if (parseError) return <VideoSkeleton error={parseError} />',
          'if (playbackInfoState.isLoading) return <VideoSkeleton />',
          'if (playbackInfoState.error) return <VideoSkeleton error={playbackInfoState.error} ' +
            'retry={playbackInfoState.retry} />',
          'if (!playbackInfoState.result) return <VideoSkeleton />',
          'return <VideoActionsMenu {...videoActionsMenuProps}><ActionsMenu ... ' +
            '/></VideoActionsMenu>',
          '```',
          '',
          'Every story below runs the REAL `useVideoPlaybackInfo` hook against the REAL ' +
            '`VideoPreview` dispatch; nothing is stubbed. What is controlled is the one REST call ' +
            "the hook makes (`client.request({uri: '.../playback-info'})`), using the mock " +
            "client's own `requests`/`requestCallback` seam " +
            '(`packages/sanity/test/mocks/mockSanityClient.ts`) rather than a fabricated backend, ' +
            'the same mechanism the rest of this storybook already trusts for every other ' +
            'client-backed story.',
          '',
          '**Answering the four questions this page was asked.**',
          '',
          '<details><summary><b>Still processing vs. failed vs. deleted vs. network failure: ' +
            'four situations, effectively two appearances.</b></summary>',
          '',
          '"Still processing" (Media Library asset `state: "processing"`, polled for up to 2 ' +
            'minutes via `pollForReadyState`) never surfaces as its own screen: the poll runs ' +
            'silently while `playbackInfoState.isLoading` stays `true` the whole time ' +
            '(`startWith(loadingState)` fires once, nothing re-emits mid-poll), so it is the bare ' +
            '`<VideoSkeleton />`, identical to the very first instant of loading. "Failed to ' +
            'process" (`doc.state` is anything other than `"ready"`/`"processing"`), "deleted" ' +
            '(the asset document is not found at all, see the `DeletedOrMissing` story, whose own ' +
            'error message claims to be retrying and is not), and a genuine network failure ' +
            'fetching `/playback-info` (any non-404 rejection) all land in the SAME branch, ' +
            '`playbackInfoState.error`, with the SAME critical-toned card and Retry button, ' +
            'distinguished only by whatever raw `Error.message` string happens to have been ' +
            "thrown. None of the three has a curated, translated message; `VideoSkeleton`'s one " +
            'translated string (`video-error.description`) is reached only when `error.message` ' +
            'is falsy, which none of the errors this file constructs are (see `NoMessage` below ' +
            'for the one case that does reach it).',
          '',
          '</details>',
          '',
          '<details><summary><b>No poster or thumbnail state exists in this component at ' +
            'all.</b></summary>',
          '',
          'The playback-info response carries `thumbnail`, `animated` and `storyboard` URLs ' +
            '(with their own signed tokens via `getPlaybackTokens`), but nothing in ' +
            '`VideoPreview`, `VideoActionsMenu` or `VideoSkeleton` reads any of them. The only ' +
            '"before playback" surface `VideoPreview`\'s own chain renders is `VideoActionsMenu`\'s ' +
            '`React.lazy` `<Suspense fallback={<VideoSkeleton aspectRatio={...} />}>` while the ' +
            '`VideoPlayer` chunk itself downloads, a THIRD situation sharing the bare-skeleton ' +
            'appearance from the previous finding, this time for "the code to play the video has ' +
            'not arrived yet" rather than "the video itself has not arrived yet". Whatever a ' +
            "viewer sees before a frame decodes belongs entirely to `@mux/mux-player-react`'s own " +
            'internal behaviour (it does receive `tokens.thumbnail`/`tokens.storyboard`), which ' +
            'is outside this codebase and not traced further here.',
          '',
          '</details>',
          '',
          '<details><summary><b>Nothing indicates duration or size before commit-to-load, and ' +
            'for duration this is not a rendering gap: the data is fetched and then never ' +
            'read.</b></summary>',
          '',
          '`VideoPlaybackInfo.duration` (seconds) is set from every resolved response and never ' +
            'referenced anywhere else in `VideoInput/` (grepped: zero other hits). `ActionsMenu` ' +
            '(the shared menu this component reuses from the file-input family) offers ' +
            'upload/browse/download/copy-url/open-in-source/reset and nothing else: no length, no ' +
            'dimensions. Size is not even modelled: unlike image assets, `VideoPlaybackInfo` has ' +
            'no size field at all. A person decides whether to open a video with strictly less ' +
            'information than they get for an image.',
          '',
          '</details>',
          '',
          '<details><summary><b>A genuinely new instance of the pattern this series keeps ' +
            'finding, but sharper than the others.</b></summary>',
          '',
          "`if (!playbackInfoState.result)` (line ~293) looks, from the hook's own declared " +
            'return type (`VideoPlaybackInfoLoadable`), like the same shape of dead branch as ' +
            "`MemberField`'s `return null` or `ChangeResolver`'s unknown-type fallback: the type " +
            'only produces an unpopulated `result` when `isLoading` is true or `error` is set, ' +
            'both already excluded above it. But this one is NOT dead: `EmptyResult` below ' +
            'reaches it for real, by having the REST call succeed with a `null` body. ' +
            "TypeScript's type is a compile-time promise about what " +
            '`client.request<VideoPlaybackInfo>()` returns; nothing in this file checks the ' +
            'response against it at runtime. So the branch fires exactly when it should be ' +
            'structurally impossible to, and when it does fire it renders BYTE-IDENTICAL markup ' +
            'to plain loading, the one branch in this whole series that is simultaneously ' +
            'reachable, real, and indistinguishable from something else.',
          '',
          '</details>',
          '',
          '> **Why it matters:** an editor who sees the bare skeleton has no way to know ' +
            'whether to wait two seconds or two minutes, and an editor who sees the error card ' +
            'has no way to know whether Retry will work (a real network blip), is pointless (the ' +
            "asset is gone), or needs someone else's attention (processing failed at the source): " +
            'three remedies, one screen.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:change-visibility',
    'pattern:error-recovery',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The resolved chrome: real `useVideoPlaybackInfo` success, real `VideoActionsMenu`, and a
 * real, lazily-loaded `VideoPlayer` pointed at a genuine public Mux demo asset (the same one
 * used across Mux's own player documentation) rather than a project-scoped id that could never
 * resolve. Whether the frame fills with actual video depends on this environment reaching the
 * public internet - narrated, not fabricated, the same honesty `Forms & Input/ImageInput`
 * applies to its own CDN pixels. The chrome (frame, options menu) is real either way.
 */
export const Resolved: Story = {
  decorators: [decoratorWithClient(resolvedClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/** `playbackInfoState.isLoading` is `true`, held there deterministically by a request that
 * never settles. Bare `Skeleton`, no text - see finding 1 for the two other real situations
 * this exact same markup also stands for. */
export const Loading: Story = {
  decorators: [decoratorWithClient(loadingClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/**
 * The request succeeds with an empty body. `playbackInfoState.result` is falsy despite
 * `isLoading` being `false` and `error` being `undefined` - the branch the hook's own type
 * says should be unreachable here, reached anyway. Renders identically to `Loading`: see
 * finding 4.
 */
export const EmptyResult: Story = {
  decorators: [decoratorWithClient(emptyResultClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/** A fatal error carrying a curated `.message` - "failed to process", with a working Retry
 * button wired to the hook's real `retry()`. */
export const Failed: Story = {
  decorators: [decoratorWithClient(failedClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/** The one error case that reaches `VideoSkeleton`'s single translated fallback string, because
 * the thrown value has no `.message` of its own. Compare with `Failed`: same card, same Retry
 * button, different text only because of what happened to be thrown - not a deliberate distinct
 * treatment. */
export const NoMessage: Story = {
  decorators: [decoratorWithClient(noMessageClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/**
 * A 404, left to run the real poll-then-fail sequence with no additional mocking. Same critical
 * card and Retry button as `Failed`, but the message ("Asset document ... not found,
 * retrying...") is generated by code that promises a retry it does not perform - see finding 1.
 * Indistinguishable on screen from a genuine "failed to process" or a plain network error.
 */
export const DeletedOrMissing: Story = {
  name: 'Deleted or missing asset',
  decorators: [decoratorWithClient(deletedOrMissingClient)],
  render: () => <Harness value={boundVideoValue} />,
}

/**
 * `parseError`: the ref starts with `media-library:` (so `VideoAsset`'s looser upstream guard
 * lets it through) but has only two colon-segments instead of three, so `getMediaLibraryId`
 * throws inside `VideoPreview` itself. A narrower, rarer malformation than the one
 * `InvalidVideoWarning` (`Video.stories.tsx`) already covers - this one is `VideoPreview`'s
 * own guard, not its caller's.
 */
export const MalformedReference: Story = {
  name: 'Malformed reference (parseError)',
  decorators: [decoratorWithClient(createMockSanityClient())],
  render: () => <Harness value={malformedRefValue} />,
}

/**
 * No bound value at all. `VideoPreview` returns `null` before any hook state is read - the
 * dashed box below is the story frame; the component itself rendered nothing, matching this
 * storybook's convention for stories whose point is an empty return.
 */
export const NoAsset: Story = {
  decorators: [decoratorWithClient(createMockSanityClient())],
  render: () => (
    <div style={{maxWidth: 360, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc'}}>
      <Harness value={undefined} />
    </div>
  ),
}
