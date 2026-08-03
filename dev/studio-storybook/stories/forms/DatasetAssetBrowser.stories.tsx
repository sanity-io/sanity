import {type SanityClient} from '@sanity/client'
import {ImagesIcon} from '@sanity/icons/Images'
import {
  type AssetSource,
  type AssetSourceComponentProps,
  type FileAsset,
  type ImageAsset,
  type SanityDocument,
} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {NEVER, type Observable, of} from 'rxjs'

import {AssetRow} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/file/AssetRow'
import {FileListView} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/file/FileListView'
import {AssetThumb} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/image/AssetThumb'
import {ImageListView} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/image/ImageListView'
import {AssetDeleteDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/shared/AssetDeleteDialog'
import {AssetMenu} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/shared/AssetMenu'
import {AssetUsageDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/shared/AssetUsageDialog'
import {SelectAssetsDialog} from '../../../../packages/sanity/src/core/form/studio/assetSourceDataset/shared/SelectAssetsDialog'
// Real components from their real paths (org contract §8): the files under test.
import {createMockSanityClient} from '../../../../packages/sanity/test/mocks/mockSanityClient'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'
import {OverlayFrame} from '../overlays/OverlayFrame'

/* ── Fixture universe ─────────────────────────────────────────────────────
   Four file assets and four image assets, plus the documents that reference two of
   them. The "in use" pair (one file, one image) is what makes the delete-safety and
   type-labeling findings below checkable rather than asserted. */

const fileUnused: FileAsset = {
  _id: 'file-a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0-pdf',
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-unused-1',
  _createdAt: '2026-06-01T09:00:00Z',
  _updatedAt: '2026-06-01T09:00:00Z',
  originalFilename: 'annual-report-2026.pdf',
  url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/annual-report-2026.pdf',
  path: 'files/mock-project-id/mock-data-set/annual-report-2026.pdf',
  assetId: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  extension: 'pdf',
  mimeType: 'application/pdf',
  sha1hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
  size: 2_411_233,
  metadata: {},
}

/** Filename runs past 37 chars → `AssetRow`'s `showTooltip` branch (AssetRow.tsx:151). */
const fileInUse: FileAsset = {
  _id: 'file-b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1-docx',
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-in-use-1',
  _createdAt: '2026-06-03T09:00:00Z',
  _updatedAt: '2026-06-03T09:00:00Z',
  originalFilename: 'board-meeting-minutes-2026-q2-department-summary-review.docx',
  url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/board-minutes-q2.docx',
  path: 'files/mock-project-id/mock-data-set/board-minutes-q2.docx',
  assetId: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
  extension: 'docx',
  mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  sha1hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
  size: 88_450,
  metadata: {},
}

/** Its referring-documents fetch never resolves - see `DeleteDialogUsageCheckPending`. */
const filePending: FileAsset = {
  _id: 'file-c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2-pdf',
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-pending-1',
  _createdAt: '2026-06-04T09:00:00Z',
  _updatedAt: '2026-06-04T09:00:00Z',
  originalFilename: 'usage-check-in-progress.pdf',
  url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/usage-check-in-progress.pdf',
  path: 'files/mock-project-id/mock-data-set/usage-check-in-progress.pdf',
  assetId: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
  extension: 'pdf',
  mimeType: 'application/pdf',
  sha1hash: 'c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2',
  size: 512_004,
  metadata: {},
}

const fileDecor: FileAsset = {
  _id: 'file-d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3-csv',
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-decor-1',
  _createdAt: '2026-06-05T09:00:00Z',
  _updatedAt: '2026-06-05T09:00:00Z',
  originalFilename: 'dataset-export-2025-12-31.csv',
  url: 'https://cdn.sanity.io/files/mock-project-id/mock-data-set/dataset-export.csv',
  path: 'files/mock-project-id/mock-data-set/dataset-export.csv',
  assetId: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
  extension: 'csv',
  mimeType: 'text/csv',
  sha1hash: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3',
  size: 14_820,
  metadata: {},
}

const fileAssets: FileAsset[] = [fileUnused, fileInUse, filePending, fileDecor]

function imageMetadata(width: number, height: number) {
  return {
    _type: 'sanity.imageMetadata' as const,
    dimensions: {
      _type: 'sanity.imageDimensions' as const,
      width,
      height,
      aspectRatio: width / height,
    },
    hasAlpha: false,
    isOpaque: true,
  }
}

const imageUnused: ImageAsset = {
  _id: 'image-e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4-2000x3000-jpg',
  _type: 'sanity.imageAsset',
  _rev: 'rev-image-unused-1',
  _createdAt: '2026-06-02T10:00:00Z',
  _updatedAt: '2026-06-02T10:00:00Z',
  originalFilename: 'coastline-sunrise.jpg',
  url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/coastline-sunrise-2000x3000.jpg',
  path: 'images/mock-project-id/mock-data-set/coastline-sunrise-2000x3000.jpg',
  assetId: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
  size: 1_842_004,
  metadata: imageMetadata(2000, 3000),
}

/** Referenced by two campaign pages - see `UsageDialogHasUsage` / `DeleteDialogInUse`. */
const imageInUse: ImageAsset = {
  _id: 'image-f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5-1600x900-jpg',
  _type: 'sanity.imageAsset',
  _rev: 'rev-image-in-use-1',
  _createdAt: '2026-06-06T10:00:00Z',
  _updatedAt: '2026-06-06T10:00:00Z',
  originalFilename: 'team-offsite-cover.jpg',
  url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/team-offsite-cover-1600x900.jpg',
  path: 'images/mock-project-id/mock-data-set/team-offsite-cover-1600x900.jpg',
  assetId: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5',
  size: 612_880,
  metadata: imageMetadata(1600, 900),
}

/** Same dimensions and near-identical name/size as `imageInUse` - see `AssetIdentity`. */
const imageLookalike: ImageAsset = {
  _id: 'image-a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6-1600x900-jpg',
  _type: 'sanity.imageAsset',
  _rev: 'rev-image-lookalike-1',
  _createdAt: '2026-06-07T10:00:00Z',
  _updatedAt: '2026-06-07T10:00:00Z',
  originalFilename: 'team-offsite-cover-alt-crop.jpg',
  url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/team-offsite-cover-alt-1600x900.jpg',
  path: 'images/mock-project-id/mock-data-set/team-offsite-cover-alt-1600x900.jpg',
  assetId: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: 'a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6',
  size: 609_112,
  metadata: imageMetadata(1600, 900),
}

const imageDecor: ImageAsset = {
  _id: 'image-b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7-1200x800-jpg',
  _type: 'sanity.imageAsset',
  _rev: 'rev-image-decor-1',
  _createdAt: '2026-06-08T10:00:00Z',
  _updatedAt: '2026-06-08T10:00:00Z',
  originalFilename: 'hero-banner-draft.jpg',
  url: 'https://cdn.sanity.io/images/mock-project-id/mock-data-set/hero-banner-draft-1200x800.jpg',
  path: 'images/mock-project-id/mock-data-set/hero-banner-draft-1200x800.jpg',
  assetId: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: 'b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7',
  size: 401_775,
  metadata: imageMetadata(1200, 800),
}

const imageAssets: ImageAsset[] = [imageUnused, imageInUse, imageLookalike, imageDecor]

/* ── Referring documents (who is using the "in use" assets) ──────────────── */

const referringDocs: SanityDocument[] = [
  {
    _id: 'article-board-summary-1',
    _type: 'article',
    _rev: 'rev-article-1',
    _createdAt: '2026-05-01T00:00:00Z',
    _updatedAt: '2026-05-01T00:00:00Z',
    title: 'Q2 Board Summary Notes',
  },
  {
    _id: 'article-board-summary-2',
    _type: 'article',
    _rev: 'rev-article-2',
    _createdAt: '2026-05-02T00:00:00Z',
    _updatedAt: '2026-05-02T00:00:00Z',
    title: 'Q2 Board Follow-ups',
  },
  {
    _id: 'campaignPage-offsite-recap',
    _type: 'campaignPage',
    _rev: 'rev-campaign-1',
    _createdAt: '2026-05-03T00:00:00Z',
    _updatedAt: '2026-05-03T00:00:00Z',
    title: 'Team Offsite Recap Page',
  },
  {
    _id: 'campaignPage-offsite-gallery',
    _type: 'campaignPage',
    _rev: 'rev-campaign-2',
    _createdAt: '2026-05-04T00:00:00Z',
    _updatedAt: '2026-05-04T00:00:00Z',
    title: 'Offsite Photo Gallery',
  },
]

/**
 * Keyed by asset `_id`, this drives `useLegacyReferringDocuments` (via
 * `useReferringDocuments.ts`) for both `AssetUsageDialog` and `AssetDeleteDialog`.
 * `'never'` reproduces a usage check that never resolves - the real shape of a slow
 * or hung network request, not a fabricated prop.
 */
const referringDocsByAssetId: Record<string, SanityDocument[] | 'never'> = {
  [fileUnused._id]: [],
  [fileInUse._id]: referringDocs.filter((doc) => doc._type === 'article'),
  [filePending._id]: 'never',
  [imageUnused._id]: [],
  [imageInUse._id]: referringDocs.filter((doc) => doc._type === 'campaignPage'),
}

/**
 * Mutates `createMockSanityClient()`'s `observable` IN PLACE (same pattern
 * `lib/testProvider.tsx` uses for `.live`): the mock's own `withConfig` hands back
 * the ORIGINAL object, so a copy would be discarded the moment
 * `SelectAssetsDialog`/`AssetRow`/`AssetThumb` call `.withConfig(...)`.
 *
 * Two real query shapes are answered:
 * - `useReferringDocuments.ts`'s `*[references($docId)][0...101]` (the usage/delete
 *   dialogs) - resolved per-asset from `referringDocsByAssetId`.
 * - `SelectAssetsDialog`'s browse query, `*[_type == "sanity.imageAsset" ...]` /
 *   `"sanity.fileAsset"` - answered with the full fixture list regardless of
 *   pagination or `accept`, which is enough to show the dialog fetching for real.
 */
function createAssetBrowserClient(): SanityClient {
  const base = createMockSanityClient()
  const originalFetch = base.observable.fetch
  base.observable.fetch = (
    query: string,
    params?: Record<string, unknown>,
  ): Observable<unknown> => {
    if (typeof query === 'string' && query.includes('references($docId)')) {
      const docId = params?.docId as string | undefined
      const entry = docId ? referringDocsByAssetId[docId] : undefined
      if (entry === 'never') return NEVER
      return of(entry ?? [])
    }
    if (typeof query === 'string' && query.includes('_type ==')) {
      return of(query.includes('sanity.fileAsset') ? fileAssets : imageAssets)
    }
    return originalFetch(query, params)
  }
  // The mock's `observable` has no `delete` method at all; `AssetRow`/`AssetThumb` call
  // it on confirm, so a story that opens the delete dialog needs one, even though we
  // never assert on the outcome.
  ;(base.observable as unknown as {delete: (id: string) => Observable<unknown>}).delete = () =>
    of({})
  return base as unknown as SanityClient
}

const client = createAssetBrowserClient()
const previewStore = createMockDocumentPreviewStore({documents: referringDocs})

const decorator = WithStudioProviders({
  config: {
    schema: {
      name: 'storybook-dataset-asset-browser',
      types: [
        {
          name: 'article',
          title: 'Article',
          type: 'document',
          fields: [{name: 'title', title: 'Title', type: 'string'}],
          preview: {select: {title: 'title'}},
        },
        {
          name: 'campaignPage',
          title: 'Campaign page',
          type: 'document',
          fields: [{name: 'title', title: 'Title', type: 'string'}],
          preview: {select: {title: 'title'}},
        },
      ],
    },
  },
  client,
  previewStore,
})

const noop = () => undefined

const meta: Meta = {
  title: 'Forms & Input/Dataset Asset Browser',
  decorators: [decorator],
  parameters: {
    docs: {
      description: {
        component: [
          'The one dialog whose entire job is telling someone before they delete something in ' +
            'use has a window, not an edge case, the ordinary loading window every open goes ' +
            'through, where the thing it is supposed to prevent is not prevented.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/studio/assetSourceDataset/` |',
          '| Tier | SERVICE. The built-in asset source every Studio ships with: it lists what has already been uploaded to the dataset, alongside whatever Media Library, Unsplash or custom sources a project configures through `AssetSourceBrowser` |',
          '| Audit | 🔴 needs-work (`destructive-friction`, `spinners-loading`, `similarity`). The delete safety gate is not active for the entire window before the usage check resolves, the image thumbnail grid hardcodes the wrong asset type into its dialogs, and the image list has no visible message at all for "no images here" |',
          '| Patterns | `destructive-friction` · `spinners-loading` · `similarity` |',
          '',
          '`SelectAssetsDialog` (the top-level dialog opened from a file/image field\'s "Browse" ' +
            'button) fetches a page of `sanity.fileAsset` or `sanity.imageAsset` documents and ' +
            'hands them to `FileListView` or `ImageListView`. Each row (`AssetRow`) or thumbnail ' +
            '(`AssetThumb`) carries its own menu (`AssetMenu`) wired to two dialogs: ' +
            '`AssetUsageDialog` (read-only: which documents reference this asset) and ' +
            '`AssetDeleteDialog` (the same information, plus a delete action gated on it).',
          '',
          '**What reading it turned up.**',
          '',
          '<details><summary><b>The delete guard is not active while the check that feeds it is still running.</b></summary>\n\n' +
            "`AssetDeleteDialog`'s confirm button reads `disabled: hasResults` " +
            '(AssetDeleteDialog.tsx:52), and `hasResults` comes from `publishedDocuments.length > ' +
            '0` (:30-39), derived from `referringDocuments`, which starts as `[]` in ' +
            "`useReferringDocuments.ts`'s `INITIAL_STATE` (:15) and only becomes non-empty once " +
            "the live query resolves. The dialog's `isLoading` conditional (:65-85) only swaps the " +
            'body between a spinner and the confirm message; the footer, where the confirm button ' +
            'lives, is a separate prop to `Dialog` (`ui-components/dialog/Dialog.tsx`) that ' +
            'renders unconditionally. So for the entire window between the dialog opening and the ' +
            "usage query's first emission, and for the rest of a query that never resolves at " +
            'all, the delete button is enabled, not disabled-with-a-spinner. ' +
            '`DeleteDialogUsageCheckPending` reproduces this with a query that never ' +
            'emits.\n\n</details>',
          '',
          '<details><summary><b>The usage-count copy is exact, and silently wrong past 101.</b></summary>\n\n' +
            '`useReferringDocuments` fetches `*[references($docId)][0...101]` and its own doc ' +
            'comment (:24) says so, "will only return the 101 first documents". Nothing ' +
            "downstream repeats that limit: `AssetUsageList`'s header interpolates an exact " +
            "`{{count}}` ('{{count}} documents are using this file' / 'One document is using " +
            "this file' / 'No documents are using this file', `studio.ts` i18n bundle), and " +
            'neither `ConfirmMessage` nor `AssetUsageDialog` mentions truncation. An asset ' +
            'referenced by 150 documents reports itself as used by exactly 101, with no ' +
            "indication more exist, contrast `ConfirmDeleteDialog`'s equivalent cap, which at " +
            'least has `OtherReferenceCount` (imperfectly) saying something was ' +
            'hidden.\n\n</details>',
          '',
          '<details><summary><b>`AssetThumb` hardcodes `assetType="file"` for both of its dialogs, even though it only ever renders images.</b></summary>\n\n' +
            '`AssetThumb.tsx:179` (`AssetUsageDialog`) and `:188` (`AssetDeleteDialog`) both pass ' +
            'the literal string `"file"`, `AssetThumb` is imported only by `ImageListView`, which ' +
            'only ever supplies `sanity.imageAsset` documents. The two i18n keys that key off ' +
            '`assetType` (`asset-source.asset-usage-dialog.header_file`/`_image`, ' +
            '`asset-source.delete-dialog.header_file`/`_image`, and the ' +
            '`documents-using-${assetType}` / `warning-${assetType}-is-in-use` family) all ' +
            'resolve to the file strings for an image: the dialog header reads "Delete file" / ' +
            '"Documents using file" while deleting or inspecting a photo. The toasts ' +
            '(`asset-source.image.asset-list.delete-failed`/`delete-successful`, ' +
            'AssetThumb.tsx:124,134) are correctly image-scoped, which is what makes this look ' +
            'like a copy-paste slip rather than a deliberate simplification, one call site was ' +
            'updated, the other two were not. `UsageDialogHasUsage` and `DeleteDialogInUse` ' +
            'reproduce the exact call `AssetThumb` makes.\n\n</details>',
          '',
          "<details><summary><b>`ImageListView`'s empty state renders no visible content at all.</b></summary>\n\n" +
            '`FileListView` has a loading branch (spinner, :63-69) and simply renders nothing ' +
            'extra when `assets.length === 0` and not loading, the column headers stay, the body ' +
            'underneath is blank. `ImageListView` also has a loading branch (:37-41), but its ' +
            'not-loading-and-empty branch (:42) is `<Text align="center" muted />`, an empty ' +
            '`Text` node with no children. Both list types communicate "no images/files here" ' +
            "purely through absence, but `ImageListView`'s dedicated empty-state element renders " +
            'literally nothing, which reads as a stalled or broken page rather than a deliberate ' +
            '"there is nothing here" message. `EmptyAndLoadingStates` puts all four combinations ' +
            'side by side.\n\n</details>',
          '',
          '<details><summary><b>Distinguishing two similar assets is asymmetric between the two browsers.</b></summary>\n\n' +
            '`AssetRow` (file rows) renders the filename, size, formatted MIME type and a ' +
            'relative date inline (AssetRow.tsx:277-436), two files with a similar name are still ' +
            'told apart by size/type/date. `AssetThumb` (image tiles) renders exactly one `<img>` ' +
            'and a hover-revealed menu (AssetThumb.tsx:208-229): no filename, no size, no date, ' +
            'anywhere in the component. `originalFilename` reaches `AssetThumb` only as an `alt` ' +
            'attribute, which is not visible sighted-rendered text. Two images with the same ' +
            'dimensions and near-identical names (`imageInUse` / `imageLookalike` below) are ' +
            'indistinguishable in the grid by anything this component renders, regardless of ' +
            'whether the underlying pixels differ, the claim holds even where these fixtures ' +
            "can't show working pixels (see the fixture note below).\n\n</details>",
          '',
          '> **Why it matters:** the one dialog whose entire job is telling someone before they ' +
            'delete something in use has a window, not an edge case, where the thing it is ' +
            'supposed to prevent is not prevented. And the one place a person would look to tell ' +
            'two images apart shows them nothing to look at except the pixels themselves.',
          '',
          '**Fixture note.** These asset URLs are shaped like real `cdn.sanity.io` paths but do ' +
            'not resolve, `AssetThumb` always appends `?h=<n>&fit=max` to `asset.url` ' +
            '(AssetThumb.tsx:204-206), which only a real image CDN can serve. Every thumbnail ' +
            'below renders as a broken image, the same boundary `ImageInput.stories.tsx` ' +
            'documents for bound image values. The surrounding chrome (menu, dialogs, hover ' +
            'state, the delete flow) is real and live; only the pixels are out of reach offline.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:destructive-friction',
    'pattern:spinners-loading',
    'pattern:similarity',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/* ── 1. The two list views, side by side ─────────────────────────────────── */

/**
 * `FileListView` and `ImageListView` do the same job - render a page of assets with
 * per-item delete/usage actions - for different media. Side by side, the asymmetry in
 * finding 5 above is visible directly: the file rows carry name/size/type/date, the
 * image tiles carry only a picture (here, a broken one - see the fixture note).
 */
export const ListViews: Story = {
  name: 'File and image list views, side by side',
  render: () => (
    <Flex gap={4} align="flex-start" wrap="wrap">
      <Stack gap={2} style={{width: 460}}>
        <Text size={1} weight="medium">
          FileListView
        </Text>
        <Card border radius={2} padding={3}>
          <FileListView
            assets={fileAssets}
            selectedAssets={[fileInUse]}
            onClick={noop}
            onKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 460}}>
        <Text size={1} weight="medium">
          ImageListView
        </Text>
        <Card border radius={2} padding={3}>
          <ImageListView
            assets={imageAssets}
            selectedAssets={[imageInUse]}
            onItemClick={noop}
            onItemKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
    </Flex>
  ),
}

/* ── 2. AssetRow's two returns: desktop grid vs mobile card ──────────────── */

/**
 * `AssetRow` takes `isMobile` as its own prop (not just derived internally by
 * `FileListView` via `useMediaIndex()`), so both of its returns - the five-column
 * desktop grid (AssetRow.tsx:352-450) and the collapsible mobile card
 * (AssetRow.tsx:250-350) - are reachable directly, without resizing a viewport.
 */
export const AssetRowLayouts: Story = {
  name: 'AssetRow: desktop grid vs mobile card',
  render: () => (
    <Flex gap={4} align="flex-start" wrap="wrap">
      <Stack gap={2} style={{width: 420}}>
        <Text size={1} weight="medium">
          Desktop (isMobile=false)
        </Text>
        <Card border radius={2}>
          <AssetRow asset={fileInUse} isMobile={false} onDeleteFinished={noop} />
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 260}}>
        <Text size={1} weight="medium">
          Mobile (isMobile=true, expanded)
        </Text>
        <Card border radius={2}>
          <AssetRow asset={fileInUse} isMobile onDeleteFinished={noop} />
        </Card>
      </Stack>
    </Flex>
  ),
}

/* ── 3. Empty vs loading, both list types (finding 4) ─────────────────────── */

/**
 * **Current (audit finding), bottom right.** Four panels: loading-with-nothing-yet
 * (spinner, both list types agree) and loaded-with-nothing (where they diverge).
 * `FileListView`'s loaded-empty panel keeps its column headers with a blank body
 * underneath; `ImageListView`'s dedicated empty-state element (:42) renders nothing
 * at all - no headers, no message, nothing to distinguish it from a page that failed
 * to mount.
 */
export const EmptyAndLoadingStates: Story = {
  name: 'Empty vs loading (both list types)',
  tags: ['audit:needs-work'],
  render: () => (
    <Flex gap={4} wrap="wrap">
      <Stack gap={2} style={{width: 340}}>
        <Text size={0} muted weight="medium">
          FileListView, loading
        </Text>
        <Card border radius={2} padding={3} style={{minHeight: 120}}>
          <FileListView
            assets={[]}
            isLoading
            selectedAssets={[]}
            onClick={noop}
            onKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 340}}>
        <Text size={0} muted weight="medium">
          FileListView, loaded and empty (headers remain, body is blank)
        </Text>
        <Card border radius={2} padding={3} style={{minHeight: 120}}>
          <FileListView
            assets={[]}
            isLoading={false}
            selectedAssets={[]}
            onClick={noop}
            onKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 340}}>
        <Text size={0} muted weight="medium">
          ImageListView, loading
        </Text>
        <Card border radius={2} padding={3} style={{minHeight: 120}}>
          <ImageListView
            assets={[]}
            isLoading
            selectedAssets={[]}
            onItemClick={noop}
            onItemKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 340}}>
        <Text size={0} muted weight="medium">
          ImageListView, loaded and empty - renders nothing visible at all
        </Text>
        <Card border radius={2} padding={3} style={{minHeight: 120}}>
          <ImageListView
            assets={[]}
            isLoading={false}
            selectedAssets={[]}
            onItemClick={noop}
            onItemKeyPress={noop}
            onDeleteFinished={noop}
          />
        </Card>
      </Stack>
    </Flex>
  ),
}

/* ── 4. Distinguishing similar assets (finding 5), isolated from the full list ── */

/**
 * `imageInUse` and `imageLookalike` share dimensions and a near-identical filename.
 * Two `AssetThumb`s side by side show nothing that would tell them apart even with
 * working pixels (no filename, size or date rendered - see finding 5). Two
 * `AssetRow`s built from the same pair of names, for contrast, are told apart by
 * name/size/type/date alone.
 */
export const AssetIdentity: Story = {
  name: 'Can you tell two similar assets apart?',
  render: () => (
    <Flex gap={4} align="flex-start" wrap="wrap">
      <Stack gap={2} style={{width: 280}}>
        <Text size={0} muted weight="medium">
          Two AssetThumbs: same dimensions, near-identical names - nothing rendered distinguishes
          them
        </Text>
        <Card border radius={2} padding={3}>
          <Flex gap={2}>
            <div style={{width: 110}}>
              <AssetThumb asset={imageInUse} isSelected={false} onDeleteFinished={noop} />
            </div>
            <div style={{width: 110}}>
              <AssetThumb asset={imageLookalike} isSelected={false} onDeleteFinished={noop} />
            </div>
          </Flex>
        </Card>
      </Stack>
      <Stack gap={2} style={{width: 420}}>
        <Text size={0} muted weight="medium">
          The same pair of names as AssetRows - size, type and date differentiate them
        </Text>
        <Card border radius={2}>
          <AssetRow asset={imageInUse} onDeleteFinished={noop} />
          <AssetRow asset={imageLookalike} onDeleteFinished={noop} />
        </Card>
      </Stack>
    </Flex>
  ),
}

/* ── 5. AssetMenu's own two tones ─────────────────────────────────────────── */

/**
 * `AssetMenu` itself: the unselected/bordered trigger (`ContextMenuButton` in `ghost`
 * mode) versus the selected trigger, whose tone/mode flip to read against the
 * selected row/thumb's own inverted colors (AssetMenu.tsx:21-22).
 */
export const AssetMenuStates: Story = {
  name: 'AssetMenu: default vs selected',
  render: () => (
    <Flex gap={4}>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Default (border=true, ghost trigger)
        </Text>
        <Card padding={3} border radius={2} style={{width: 140}}>
          <AssetMenu isSelected={false} onAction={noop} />
        </Card>
      </Stack>
      <Stack gap={2}>
        <Text size={0} muted weight="medium">
          Selected (border=false, primary trigger)
        </Text>
        <Card padding={3} border radius={2} tone="primary" style={{width: 140}}>
          <AssetMenu isSelected border={false} onAction={noop} />
        </Card>
      </Stack>
    </Flex>
  ),
}

/* ── 6. AssetUsageDialog: no usage vs has usage (with the mislabel) ───────── */

/**
 * Zero referring documents, `assetType="file"` - the correct call `AssetRow` makes.
 * `AssetUsageList`'s header states the count exactly ("No documents are using this
 * file"), not "no documents found (of up to 101 checked)".
 */
export const UsageDialogNoUsage: Story = {
  name: 'AssetUsageDialog: no usage (file, correctly labeled)',
  render: () => (
    <OverlayFrame minHeight={280}>
      <AssetUsageDialog assetType="file" asset={fileUnused} onClose={noop} />
    </OverlayFrame>
  ),
}

/**
 * **Current (audit finding).** Two referring documents, real `Preview` rows via
 * `IntentLink`. `assetType="file"` here reproduces `AssetThumb.tsx:179` verbatim -
 * this is an IMAGE asset, but the header still reads "Documents using file" and the
 * list header "documents are using this file", because `AssetThumb` hardcodes the
 * string regardless of what it is showing.
 */
export const UsageDialogHasUsage: Story = {
  name: 'AssetUsageDialog: has usage (image, mislabeled "file")',
  tags: ['audit:needs-work'],
  render: () => (
    <OverlayFrame minHeight={360}>
      <AssetUsageDialog assetType="file" asset={imageInUse} onClose={noop} />
    </OverlayFrame>
  ),
}

/* ── 7. AssetDeleteDialog: the three states behind the delete-safety question ── */

/**
 * No referring documents: the confirm message (`ConfirmMessage`'s `hasResults=false`
 * return) and an enabled, correctly-labeled "Delete file" button.
 */
export const DeleteDialogUnused: Story = {
  name: 'AssetDeleteDialog: unused asset, deletable',
  render: () => (
    <OverlayFrame minHeight={280}>
      <AssetDeleteDialog assetType="file" asset={fileUnused} onClose={noop} onDelete={noop} />
    </OverlayFrame>
  ),
}

/**
 * **Current (audit finding).** Two referring documents: `ConfirmMessage`'s
 * `hasResults=true` return (the caution card + checkered image preview) and
 * `AssetUsageList` below it, confirm button correctly DISABLED. `assetType="file"`
 * again reproduces `AssetThumb.tsx:188` verbatim against an image asset - the header
 * reads "Delete file", the warning reads "cannot be deleted... this file", for a
 * photo.
 */
export const DeleteDialogInUse: Story = {
  name: 'AssetDeleteDialog: in use, blocked (image, mislabeled "file")',
  tags: ['audit:needs-work'],
  render: () => (
    <OverlayFrame minHeight={460}>
      <AssetDeleteDialog assetType="file" asset={imageInUse} onClose={noop} onDelete={noop} />
    </OverlayFrame>
  ),
}

/**
 * **Current (audit finding) - the delete-safety question.** `filePending`'s usage
 * query never emits (mocked with `NEVER`, see `createAssetBrowserClient` above): the
 * body shows the loading spinner indefinitely, exactly as it would for a slow or
 * failed network request. The confirm button in the footer is a SEPARATE prop to
 * `Dialog` from the body content (`AssetDeleteDialog.tsx`'s `isLoading` ternary only
 * swaps what is inside the `Stack`) and its `disabled: hasResults` (:52) reads
 * `hasResults` from `referringDocuments`, which starts as `[]` in
 * `useReferringDocuments.ts`'s `INITIAL_STATE` (:15). So the button is enabled from
 * the moment the dialog mounts, for the entire time the check has not (yet, or ever)
 * told it otherwise. This is not a retry-after-error path re-guarding weakly - there
 * is no error state in this dialog at all - it is the FIRST, ordinary state doing the
 * same thing: the guard is simply not wired to "is this check still running".
 * Clicking Delete here, right now, calls `onDelete` with no usage information ever
 * having been confirmed.
 */
export const DeleteDialogUsageCheckPending: Story = {
  name: 'AssetDeleteDialog: usage check never resolves (confirm still enabled)',
  tags: ['audit:needs-work'],
  render: () => (
    <OverlayFrame minHeight={280}>
      <AssetDeleteDialog assetType="file" asset={filePending} onClose={noop} onDelete={noop} />
    </OverlayFrame>
  ),
}

/* ── 8. In context: the real top-level browse dialog ─────────────────────── */

const dummyAssetSource: AssetSource = {
  name: 'sanity-dataset',
  // oxlint-disable-next-line no-deprecated -- title stays optional and is still read as a display fallback in real components; these stories have no live i18n bundle wired in for a fabricated i18nKey to resolve against
  title: 'Uploaded images',
  icon: ImagesIcon,
  component: () => null,
}

const selectAssetsProps: AssetSourceComponentProps = {
  action: 'select',
  assetSource: dummyAssetSource,
  assetType: 'image',
  accept: '',
  selectionType: 'single',
  selectedAssets: [],
  onClose: noop,
  onSelect: noop,
}

/**
 * The full `SelectAssetsDialog`, as it appears when an image field's "Browse" button
 * opens the dataset source: a real fetch (via `createAssetBrowserClient` above)
 * returns the fixture image list, `ImageListView` renders it, and every row's menu,
 * usage dialog and delete dialog are the real, live components exercised above -
 * not a narrower stand-in.
 */
export const InContext: Story = {
  name: 'In context: SelectAssetsDialog',
  render: () => (
    <OverlayFrame minHeight={520}>
      <SelectAssetsDialog {...selectAssetsProps} />
    </OverlayFrame>
  ),
}
