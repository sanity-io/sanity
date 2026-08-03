import {type ReferenceValue} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {useState} from 'react'

import {SearchFilterAssetInput} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/Asset'
// Real components from real paths (org contract §8).
import {AssetPreview} from '../../../../packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/preview/AssetPreview'
import {
  BOUND_FILE_REF,
  BOUND_IMAGE_REF,
  fileAssetFixtures,
  imageAssetFixtures,
} from '../../lib/mockAssetFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {SearchHarness} from '../../lib/searchHarness'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Fixture references ──────────────────────────────────────────────────
   A "missing" reference just points `_ref` at an id the seeded preview store does not carry.
   `mockDocumentPreviewStore.ts`'s `observePaths` resolves an unresolvable id to `null`
   synchronously (`emit(doc ?? null)`) rather than throwing or hanging - the same contract the
   real store has for a genuinely deleted document - so these are a faithful simulation of "the
   reference exists, the target does not," not a story-only trick. */

const boundFileReference: ReferenceValue = {_type: 'sanity.fileAsset', _ref: BOUND_FILE_REF}
const missingFileReference: ReferenceValue = {
  _type: 'sanity.fileAsset',
  _ref: 'file-does-not-exist-in-this-dataset',
}
const boundImageReference: ReferenceValue = {_type: 'sanity.imageAsset', _ref: BOUND_IMAGE_REF}
const missingImageReference: ReferenceValue = {
  _type: 'sanity.imageAsset',
  _ref: 'image-does-not-exist-in-this-dataset',
}

/** A real, shipped asset type (`media-library/plugin/schemas/types.ts`'s `VideoAsset._type`)
 * that `AssetPreview` does not branch on - neither `startsWith` check matches it (:13, :16). */
const unrecognizedReference: ReferenceValue = {_type: 'sanity.videoAsset', _ref: 'video-anything'}

const previewStore = createMockDocumentPreviewStore({
  documents: [...fileAssetFixtures, ...imageAssetFixtures],
})

function Preview({reference, testId}: {reference: ReferenceValue | null; testId: string}) {
  return (
    <Card border padding={3} radius={0} data-testid={testId} style={{width: 320}}>
      <AssetPreview reference={reference as never} />
    </Card>
  )
}

/* ── In-context: the real filter row ─────────────────────────────────────
   `SearchFilterAssetInput('image')` returns the actual operator input component the search
   filter framework mounts - `AssetPreview` is only ever reached through it. `value`/`onChange`
   are plain props (`OperatorInputComponentProps`), so wiring them to local state is enough;
   the surrounding chrome (Undo/Clear buttons, the ContainerBox width) is the real component's
   own, not rebuilt here. */

// Built once at module scope, not per render. `SearchFilterAssetInput` is a factory that returns
// a component, so calling it inside the body would mint a new component type on every render and
// reset the input's state each time.
const ImageAssetField = SearchFilterAssetInput('image')

function AssetFilterDemo() {
  const [value, setValue] = useState<ReferenceValue | null>(boundImageReference)
  return <ImageAssetField value={value} onChange={setValue} />
}

const meta: Meta = {
  title: 'Forms & Input/AssetPreview',
  parameters: {
    docs: {
      description: {
        component: [
          'Inside a search filter, this small preview is the only thing telling someone which ' +
            'asset they narrowed to, and it cannot always say so: a reference that is still ' +
            'loading and one that will never resolve can render identically, and File and Image ' +
            'do not even agree on what identically looks like.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/studio/components/navbar/search/components/filters/filter/inputs/asset/preview/AssetPreview.tsx` |',
          '| Tier | SERVICE. The row that tells a person which asset a search filter is currently narrowed to, one layer inside the navbar search subsystem |',
          '| Audit | 🟡 needs-work (`asset-preview-loading`). "Still loading" and "the reference no longer resolves" render identically, and File and Image do not even agree on what "identically" looks like |',
          '| Patterns | `asset-preview-loading` |',
          '',
          'Not the asset picker, the small preview shown once a search filter has a value. Given ' +
            'a `ReferenceValue`, it dispatches to `FileReferencePreview` or `ImageReferencePreview` ' +
            'by `_type` prefix, so a person filtering "images tagged like this one" or "documents ' +
            'referencing this PDF" can see what they picked without opening it.',
          '',
          '**What reading the whole chain turned up.**',
          '',
          '<details><summary><b>Four branches, two of them silent.</b></summary>\n\n' +
            '`!reference` returns `null` (:10-12); a `_type` starting with `sanity.fileAsset` ' +
            'routes to `FileReferencePreview` (:13-15); one starting with `sanity.imageAsset` ' +
            'routes to `ImageReferencePreview` (:16-18); anything else, a bound reference whose ' +
            'type this component does not recognise, falls through to a bare `return null` (:19). ' +
            'A video-asset reference (`sanity.videoAsset`, a real, shipped type, ' +
            '`media-library/plugin/schemas/types.ts`) takes this last branch: present, resolved, ' +
            'and shown as nothing.\n\n</details>',
          '',
          '<details><summary><b>Both type checks are prefix matches, not equality.</b></summary>\n\n' +
            "`.startsWith('sanity.fileAsset')` / `.startsWith('sanity.imageAsset')` (:13, :16) " +
            'would also route a hypothetical `sanity.fileAssetVariant` or similar into the wrong ' +
            'branch. Not reachable with the two asset types Sanity ships today, but it is not ' +
            'testing what it looks like it is testing.\n\n</details>',
          '',
          '<details><summary><b>File and Image disagree on what "not ready yet" looks like.</b></summary>\n\n' +
            'Both delegate resolution to `WithReferencedAsset`, whose entire contract is one ' +
            'line: `documentId && asset ? children(asset) : waitPlaceholder` ' +
            '(`WithReferencedAsset.tsx:18`). `FileReferencePreview` passes ' +
            '`waitPlaceholder={<FileSkeleton />}` (:25), an animated card with the same ' +
            'icon-and-two-lines shape the resolved state has. `ImageReferencePreview` passes no ' +
            '`waitPlaceholder` at all (:37); the fallback is `undefined`, so the entire component ' +
            'renders nothing.\n\n</details>',
          '',
          '<details><summary><b>Neither one distinguishes loading from gone.</b></summary>\n\n' +
            '`waitPlaceholder` is the branch for both `asset` being not-yet-arrived and `asset` ' +
            'never arriving (a deleted or otherwise unresolvable reference resolves to the same ' +
            'falsy value `WithReferencedAsset` checks). A file whose asset was deleted shows the ' +
            'loading skeleton, permanently, with nothing to say it will never resolve. An image in ' +
            'the same situation shows nothing at all, indistinguishable from a filter row that has ' +
            'not rendered yet.\n\n</details>',
          '',
          '<details><summary><b>Once an image does resolve, it still cannot say so, because the image is the only thing on it.</b></summary>\n\n' +
            '`ImagePreview` (:43-53) holds a second, independent `loaded` state gating a ' +
            '`LoadingBlock` (:50) until the real `<img>` fires `onLoad` (:46, :51), so a ' +
            'resolved-but-not-yet-decoded image looks exactly like the still-fetching-metadata ' +
            'state above, just with a checkered box under it instead of nothing. And once it does ' +
            'load, there is no filename, no label, nothing but the picture (:48-53); contrast ' +
            '`FilePreview`, which shows filename and size as text (`FileReferencePreview.tsx:38-49`) ' +
            'independent of any thumbnail.\n\n</details>',
          '',
          '> **Why it matters:** two similar-looking images are distinguishable only by their ' +
            'pixels, there is no filename or label to fall back on, and if those pixels have not ' +
            'loaded, or never will because the reference is broken, the row gives no sign of which ' +
            'case it is. File is more honest about being stuck, at the cost of a skeleton that ' +
            'never stops promising to finish.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({config: {schema: {name: 'storybook', types: []}}, previewStore}),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:forms',
    'pattern:asset-preview-loading',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** `!reference` (:10-12): nothing rendered, the same as an unfiltered search. */
export const NoReference: Story = {
  name: 'No reference',
  render: () => <Preview reference={null} testId="no-reference" />,
}

/**
 * A bound, resolved reference of a type neither `startsWith` check matches (:19). Compare
 * against the story above: a real, present asset and an absent one render identically.
 */
export const UnrecognizedAssetType: Story = {
  name: 'Reference present, unrecognized type',
  render: () => <Preview reference={unrecognizedReference} testId="unrecognized-type" />,
}

/**
 * A resolved file asset: filename and size render as text, offline, independent of any
 * thumbnail - the richest fully-real state on this page.
 */
export const FileResolved: Story = {
  name: 'File, resolved',
  render: () => <Preview reference={boundFileReference} testId="file-resolved" />,
}

/**
 * The reference does not resolve (deleted asset, or a filter left pointing at one). Renders the
 * same `FileSkeleton` a mid-fetch reference would - permanently, with no indication it will
 * never finish.
 */
export const FileMissing: Story = {
  name: 'File, reference does not resolve',
  render: () => <Preview reference={missingFileReference} testId="file-missing" />,
}

/**
 * A resolved image asset. The asset document resolves for real (offline, from the fixture
 * store), but the `<img>` bytes cannot load without a `cdn.sanity.io` backend - the same
 * boundary `ImageInput`'s stories narrate. What is on screen is `ImagePreview`'s own
 * `LoadingBlock` (:50), which looks identical to "still fetching the asset document" even
 * though the document already resolved.
 */
export const ImageResolved: Story = {
  name: 'Image, resolved (pixels narrated)',
  render: () => <Preview reference={boundImageReference} testId="image-resolved" />,
}

/**
 * The reference does not resolve. `ImageReferencePreview` passes no `waitPlaceholder`, so this
 * renders nothing at all - contrast the story above, which at least shows a loading box, and
 * `FileMissing`, which shows a skeleton.
 */
export const ImageMissing: Story = {
  name: 'Image, reference does not resolve',
  render: () => <Preview reference={missingImageReference} testId="image-missing" />,
}

/**
 * In context: the real `SearchFilterAssetInput('image')` operator row, with a resolved image
 * already chosen - the actual surface `AssetPreview` is mounted inside, Undo/Clear buttons and
 * all, not an isolated state chip.
 */
export const InContext: Story = {
  name: 'In context',
  render: () => (
    <SearchHarness>
      <AssetFilterDemo />
    </SearchHarness>
  ),
}
