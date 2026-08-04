import {SearchIcon} from '@sanity/icons/Search'
import {UploadIcon} from '@sanity/icons/Upload'
import {LayerProvider, ToastProvider} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useRef, useState} from 'react'

// Real Studio components imported from source (org contract §2 `Source:` line), the same
// idiom as stories/overlays/Tab.stories.tsx — the `sanity` exports map does not surface
// these Media Library plugin internals.
import {ActionsMenu} from '../../../../packages/sanity/src/core/form/inputs/files/common/ActionsMenu'
import {mediaLibraryLocaleNamespace} from '../../../../packages/sanity/src/media-library/plugin/i18n'
import mediaLibraryResources from '../../../../packages/sanity/src/media-library/plugin/i18n/resources'
import {InvalidVideoWarning} from '../../../../packages/sanity/src/media-library/plugin/VideoInput/InvalidVideoWarning'
import {VideoActionsMenu} from '../../../../packages/sanity/src/media-library/plugin/VideoInput/VideoActionsMenu'
import {VideoSkeleton} from '../../../../packages/sanity/src/media-library/plugin/VideoInput/VideoSkeleton'
import {MenuItem} from '../../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {i18next} from '../../lib/i18n'

// The shared Storybook i18next (lib/i18n.ts) carries only the `studio` + `structure`
// namespaces; the VideoInput leaves translate against `media-library`. Register the real
// bundle synchronously so `useTranslation('media-library')` resolves the actual strings
// (no raw keys, no suspense) — additive, so it never disturbs another story's namespaces.
i18next.addResourceBundle('en-US', mediaLibraryLocaleNamespace, mediaLibraryResources, true, true)

/**
 * Interactive host for the video options menu: owns the open/closed state and the
 * button ref the real popover needs, and renders the genuine `ActionsMenu` as its menu
 * body. No `playbackId` is passed, so the Mux-backed `VideoPlayer` is never lazy-loaded
 * (that surface needs a live stream and is out of scope) — this is the resolved preview's
 * chrome: an aspect-ratio frame plus the browse/upload/copy-url/open-in-source/reset menu.
 */
function VideoMenuDemo(props: {readOnly?: boolean; aspectRatio?: number}) {
  const {readOnly, aspectRatio = 16 / 9} = props
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  return (
    <ToastProvider>
      <LayerProvider>
        {/* `VideoActionsMenu`'s options button is `position: absolute; top: 0; right: 0`
            (`MenuActionsWrapper`). In the real field this is anchored by a
            `position: relative` wrapper the field author (`VideoAsset.tsx`) puts around
            `VideoPreview`. Without it here the button would escape to the nearest
            positioned ancestor and pin to the viewport corner instead of the card. */}
        <div style={{maxWidth: 360, position: 'relative'}}>
          <VideoActionsMenu
            aspectRatio={aspectRatio}
            customDomain="mux.com"
            isMenuOpen={isMenuOpen}
            menuButtonRef={menuButtonRef}
            onMenuOpen={setIsMenuOpen}
          >
            <ActionsMenu
              browse={<MenuItem icon={SearchIcon} text="Browse" />}
              upload={<MenuItem icon={UploadIcon} text="Upload" />}
              copyUrl="https://stream.mux.com/mock-playback-id.m3u8"
              openInSource={() => undefined}
              openInSourceName="Media Library"
              onReset={() => undefined}
              readOnly={readOnly}
            />
          </VideoActionsMenu>
        </div>
      </LayerProvider>
    </ToastProvider>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Video',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          "This page documents the video field's chrome: the frame, options menu, and " +
            'loading/error states an editor sees around a video streaming from Mux. The Mux ' +
            'player itself, the moving pixels, needs a live playback stream and is not mounted ' +
            'here.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/media-library/plugin/VideoInput/*`, Studio-only (no design-system equivalent); a Media Library plugin surface exported via `sanity/media-library` |',
          '| Tier | SERVICE. The video field is a thin seam over two external services: Media Library owns the asset’s identity/storage and Mux owns playback. The field renders an aspect-ratio frame + an actions menu and delegates streaming and asset lifecycle behind a narrow interface (a `media-library:<lib>:<instance>` reference), exactly the decomposition boundary FileInput sits on |',
          '| Audit | ⚪ not-audited (`asset-lifecycle-reuse`). The pattern-library audit exercised the file/image inputs, not this newer video surface; the pattern it sits on is `asset-lifecycle-reuse` (the asset should be a first-class library item, not an attachment trapped in the doc), and one leaf, the loading `Skeleton`, is a small counter-example to the audit’s `skeleton-vs-spinner` blank-pane finding |',
          '| Patterns | `asset-lifecycle-reuse` |',
          '',
          'Drop a video reference into a document and this is the surface that renders: an ' +
            'aspect-ratio frame with the moving picture inside, plus a three-dots menu to browse, ' +
            'upload, copy the URL, jump to the asset in Media Library, or reset the field. It ' +
            'reads as one component, but it is really a thin seam over two external services, ' +
            'Media Library owns the asset’s identity and storage, Mux owns playback, stitched ' +
            'together behind a single `media-library:<lib>:<instance>` reference. That is the ' +
            'same decomposition boundary FileInput sits on, and it is what keeps the field small ' +
            'while the heavy lifting happens elsewhere.',
          '',
          'These stories mount the **real** VideoInput leaves directly rather than stubbing the ' +
            'network hook. In production `VideoPreview` calls `useVideoPlaybackInfo` (a polled ' +
            '`/playback-info` request) and then renders one of these leaves by state: ' +
            '`VideoSkeleton` while loading or on error, `VideoActionsMenu` once playback ' +
            'resolves, `InvalidVideoWarning` when the ref is not a Media Library video. The ' +
            'stories render the leaves those states resolve *to*, each prop-driven and fully ' +
            'offline.',
          '',
          '> **Why it matters:** an empty frame here is the honest no-stream state, not a bug. ' +
            'Every story shows the chrome *around* the stream rather than the stream itself, ' +
            'which is exactly where the Studio-authored UX lives.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:asset-lifecycle-reuse',
    'audit:not-audited',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The resolved-preview chrome: an aspect-ratio frame and the options menu. Click the
 * three-dots button to open the real `ActionsMenu` (browse / upload / copy URL / open in
 * Media Library / reset). The frame is empty here because the Mux player that would fill
 * it needs a live stream; this is the honest no-stream state of the real component.
 */
export const ActionsMenu_Landscape: Story = {
  name: 'Actions menu (16:9)',
  render: () => <VideoMenuDemo aspectRatio={16 / 9} />,
}

/**
 * The same menu over a portrait frame: `VideoActionsMenu` tones the aspect-ratio box for
 * `aspectRatio < 0.75`, capping its height so a tall video does not dominate the field.
 */
export const ActionsMenu_Portrait: Story = {
  name: 'Actions menu (portrait 9:16)',
  render: () => <VideoMenuDemo aspectRatio={9 / 16} />,
}

/**
 * Read-only: the destructive/mutating items in the menu (reset, and the browse/upload
 * affordances) are disabled; the real read-only tone, driven by the `readOnly` prop the
 * field passes down from the schema.
 */
export const ActionsMenu_ReadOnly: Story = {
  name: 'Actions menu (read only)',
  render: () => <VideoMenuDemo readOnly />,
}

/**
 * Loading: while `useVideoPlaybackInfo` is in flight, the preview renders an animated
 * `Skeleton` sized to the (as-yet-unknown) 16:9 frame, not a bare spinner on a blank
 * pane. This is the small positive against the audit’s `skeleton-vs-spinner` finding.
 */
export const Skeleton_Loading: Story = {
  name: 'Skeleton (loading)',
  tags: ['chapter:lists', 'pattern:skeleton-vs-spinner', 'audit:holds'],
  render: () => (
    <div style={{maxWidth: 360}}>
      <VideoSkeleton />
    </div>
  ),
}

/**
 * Error: a fatal playback error (e.g. the asset failed processing) tones the frame
 * `critical` and shows the error message in place of the skeleton. Rendered from a plain
 * `Error`; no network, no retry offered.
 */
export const Skeleton_Error: Story = {
  name: 'Skeleton (error, no retry)',
  render: () => (
    <div style={{maxWidth: 360}}>
      <VideoSkeleton error={new Error('This video failed to process.')} />
    </div>
  ),
}

/**
 * Error with retry: when the failure is recoverable, `VideoPreview` passes the hook’s
 * `retry` callback through and the skeleton offers a Retry button. Prop-driven here; the
 * button fires the callback without touching the network.
 */
export const Skeleton_ErrorRetry: Story = {
  name: 'Skeleton (error, retryable)',
  render: () => (
    <div style={{maxWidth: 360}}>
      <VideoSkeleton
        error={new Error('Could not load video playback info.')}
        retry={() => undefined}
      />
    </div>
  ),
}

/**
 * Invalid value guard: when the field’s `asset._ref` is not a Media Library video
 * reference, the input refuses to render a preview and shows `InvalidVideoWarning`, a
 * caution card explaining the corrupt value with a reset-to-clear action. The real
 * corrupt-value guard, offline.
 */
export const InvalidVideo: Story = {
  name: 'Invalid video reference',
  render: () => (
    <div style={{maxWidth: 480}}>
      <InvalidVideoWarning onClearValue={() => undefined} />
    </div>
  ),
}
