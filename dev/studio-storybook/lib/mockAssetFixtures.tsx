/**
 * Shared fixtures for the file/image input family (`stories/forms/FileInput`,
 * `ImageInput`, `ImageTool`).
 *
 * There is no asset backend in Storybook, so this module supplies the three things
 * the real file/image inputs read for their resolvable, offline states:
 *
 * 1. **Asset documents** (`fileAssetFixtures` / `imageAssetFixtures`) keyed by the
 *    `_ref` their bound field values point at. `observeFileAsset` /
 *    `observeImageAsset` funnel through `documentPreviewStore.observePaths` (see
 *    `client-adapters/assets.ts`), so seeding `createMockDocumentPreviewStore` with
 *    these makes the real `FilePreview` / asset-menu resolve for real. The file card
 *    (filename, size, extension, actions) needs no pixels and renders fully offline.
 *
 * 2. **A data-URI image** (`demoImageDataUri`) the hotspot editor can actually load.
 *    `ImageTool` / `ImageToolInput` take a plain `src` / `imageUrl` string and load it
 *    with `new Image()`, so a self-contained SVG data-URI drives the crop/hotspot SVG
 *    editor with genuine pixels and genuine natural dimensions — no CDN, no network.
 *    (The `ImageInput` preview, by contrast, builds a `cdn.sanity.io` URL from the
 *    asset ref via `@sanity/image-url`; that cannot resolve offline, so bound-image
 *    ImageInput stories narrate the preview boundary while keeping the actions menu
 *    live. The real pixels live in the ImageTool stories.)
 *
 * 3. **An inert asset-limit upsell context** (`WithAssetLimitUpsell`). Both
 *    `BaseFileInput` and `BaseImageInput` call `useAssetLimitsUpsellContext()`
 *    unconditionally at render, which throws without a provider — and `lib/testProvider`
 *    deliberately omits the upsell providers (no other form-input story needed them).
 *    This wraps the input subtree in an inert provider so the real components mount.
 */
import {type SanityDocument, type UploadState} from '@sanity/types'
import {type ReactNode} from 'react'
import {AssetLimitUpsellContext, type AssetLimitUpsellContextValue} from 'sanity/_singletons'

const NOW = new Date().toISOString()

/* -------------------------------------------------------------------------- */
/* Asset-limit upsell — inert provider so the real inputs can mount           */
/* -------------------------------------------------------------------------- */

const inertUpsellValue: AssetLimitUpsellContextValue = {
  upsellDialogOpen: false,
  handleOpenDialog: () => undefined,
  upsellData: null,
  telemetryLogs: {
    dialogSecondaryClicked: () => undefined,
    dialogPrimaryClicked: () => undefined,
  },
}

/** Wrap the input subtree so `useAssetLimitsUpsellContext()` resolves (never opens). */
export function WithAssetLimitUpsell(props: {children: ReactNode}) {
  return (
    <AssetLimitUpsellContext.Provider value={inertUpsellValue}>
      {props.children}
    </AssetLimitUpsellContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/* File assets                                                                */
/* -------------------------------------------------------------------------- */

/** A bound file value points here; `file-<id>-<ext>` passes `isFileSource`. */
export const BOUND_FILE_REF = 'file-8f2a1c7d9b3e4a6c8d0f2a4b6c8e0d1f2a3b4c5d-pdf'

export const fileAssetFixtures: SanityDocument[] = [
  {
    _id: BOUND_FILE_REF,
    _type: 'sanity.fileAsset',
    _rev: 'rev-file-1',
    _createdAt: '2026-05-02T09:00:00Z',
    _updatedAt: '2026-05-02T09:00:00Z',
    originalFilename: 'annual-report-2026.pdf',
    url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/8f2a1c7d9b3e.pdf',
    path: 'files/mock-project-id/mock-data-set/8f2a1c7d9b3e.pdf',
    assetId: '8f2a1c7d9b3e4a6c8d0f2a4b6c8e0d1f2a3b4c5d',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sha1hash: '8f2a1c7d9b3e4a6c8d0f2a4b6c8e0d1f2a3b4c5d',
    size: 2_411_233,
    metadata: {},
  } as SanityDocument,
]

/** A resolvable, bound file field value (published asset). */
export const boundFileValue = {
  _type: 'file',
  asset: {_type: 'reference', _ref: BOUND_FILE_REF},
}

/** A bound value whose ref is not a valid file source → `InvalidFileWarning`. */
export const invalidFileValue = {
  _type: 'file',
  asset: {_type: 'reference', _ref: 'this-is-not-a-valid-file-ref'},
}

/** Mid-upload file field value → `UploadProgress` (offline, no network). */
export const uploadingFileValue = {
  _type: 'file',
  _upload: {
    progress: 42,
    createdAt: NOW,
    updatedAt: NOW,
    file: {name: 'annual-report-2026.pdf', type: 'application/pdf'},
  } satisfies UploadState,
}

/* -------------------------------------------------------------------------- */
/* Image assets                                                               */
/* -------------------------------------------------------------------------- */

/** A bound image value points here; `image-<hash>-<w>x<h>-<ext>` passes `isImageSource`. */
export const BOUND_IMAGE_REF = 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg'

export const imageAssetFixtures: SanityDocument[] = [
  {
    _id: BOUND_IMAGE_REF,
    _type: 'sanity.imageAsset',
    _rev: 'rev-image-1',
    _createdAt: '2026-05-03T10:00:00Z',
    _updatedAt: '2026-05-03T10:00:00Z',
    originalFilename: 'coastline.jpg',
    url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg',
    path: 'images/mock-project-id/mock-data-set/Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000.jpg',
    assetId: 'Tb9Ew8CXIwaY6R1kjMvI0uRR',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sha1hash: 'Tb9Ew8CXIwaY6R1kjMvI0uRR',
    size: 1_842_004,
    metadata: {
      _type: 'sanity.imageMetadata',
      dimensions: {_type: 'sanity.imageDimensions', width: 2000, height: 3000, aspectRatio: 2 / 3},
      hasAlpha: false,
      isOpaque: true,
    },
  } as SanityDocument,
]

/** A resolvable, bound image field value (hotspot/crop omitted → defaults). */
export const boundImageValue = {
  _type: 'image',
  asset: {_type: 'reference', _ref: BOUND_IMAGE_REF},
}

/** A bound value whose ref is not a valid image source → `InvalidImageWarning`. */
export const invalidImageValue = {
  _type: 'image',
  asset: {_type: 'reference', _ref: 'this-is-not-a-valid-image-ref'},
}

/** Mid-upload image field value → `UploadProgress` (offline, no network). */
export const uploadingImageValue = {
  _type: 'image',
  _upload: {
    progress: 67,
    createdAt: NOW,
    updatedAt: NOW,
    file: {name: 'coastline.jpg', type: 'image/jpeg'},
  } satisfies UploadState,
}

/* -------------------------------------------------------------------------- */
/* A real, self-contained demo image for the hotspot / crop editor            */
/* -------------------------------------------------------------------------- */

/** Natural dimensions of {@link demoImageDataUri} — the hotspot math reads these. */
export const DEMO_IMAGE_WIDTH = 400
export const DEMO_IMAGE_HEIGHT = 300

// A landscape scene with enough content (sky gradient, sun, layered hills, a subject
// dot) that positioning a hotspot and dragging a crop reads meaningfully. Encoded at
// use-time so the raw SVG stays readable and needs no escaping.
const demoImageSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${DEMO_IMAGE_WIDTH}" height="${DEMO_IMAGE_HEIGHT}" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8ec5ff"/>
      <stop offset="1" stop-color="#e8f4ff"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#sky)"/>
  <circle cx="312" cy="72" r="34" fill="#ffd76a"/>
  <path d="M0 210 Q 100 150 200 200 T 400 190 V300 H0 Z" fill="#7bb87b"/>
  <path d="M0 250 Q 120 200 240 240 T 400 235 V300 H0 Z" fill="#4f9a63"/>
  <circle cx="150" cy="205" r="14" fill="#c0392b"/>
  <text x="12" y="28" font-family="sans-serif" font-size="15" fill="#33475b">Hotspot demo (400x300)</text>
</svg>`.trim()

export const demoImageDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(demoImageSvg)}`
