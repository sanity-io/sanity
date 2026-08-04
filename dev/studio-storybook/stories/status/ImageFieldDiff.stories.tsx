import {type Image, type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
import {type Diff, type ObjectDiff} from '../../../../packages/sanity/src/core/field/types'
// Real component from a real path (org contract §8).
import {ImageFieldDiff} from '../../../../packages/sanity/src/core/field/types/image/diff/ImageFieldDiff'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {boundImageValue, imageAssetFixtures} from '../../lib/mockAssetFixtures'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Two things this page needs that no sibling diff page needed ────────────
   1. `ImageFieldDiff` calls `useDocumentChange()` for `showFromValue`, which none of
      `DiffFromTo`/`JsonFieldDiff`/`ChangeTitleSegment` do - so a `DocumentChangeContext`
      provider is required even to mount it bare.
   2. Its `from`/`to` (inside `ImagePreview`) resolve a real `sanity.imageAsset` document
      through `useDocumentValues`, and `ImagePreview` separately builds its `<img src>` by
      calling `createImageUrlBuilder(client).image(id)...` - an ALGORITHMIC construction
      from the asset id and the client's project/dataset, not a read of the asset
      document's own `url` field. That is a different, harder mocking boundary than the
      one `static/fixture-cover.svg` solves (see the docblock finding below): the asset
      DOCUMENT resolves offline through the seeded preview store (title, dimensions,
      "deleted" detection all work), but the actual pixel request is a real
      `cdn.sanity.io` URL this environment cannot answer. Exactly the boundary
      `Forms & Input/ImageInput` already documents and narrates for the same reason. */

// Built locally rather than importing `diffSchemaTypes` from `lib/diffHarness` and extending
// it, so this file has no dependency ordering on that module - it only needs an `article`
// document type carrying one image field, which is all this page's stories touch.
const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {
        name: 'cover',
        title: 'Cover image',
        type: 'image',
        options: {hotspot: true},
        // A custom subfield beyond the built-in asset/media/crop/hotspot, so one story can
        // reach the nested `<ChangeList>` branch (`nestedFields.length > 0`) - genuinely
        // different from the crop/hotspot branch, which never uses a nested ChangeList.
        fields: [{name: 'alt', title: 'Alt text', type: 'string'}],
      },
    ],
  },
]

const AUTHOR = 'ada'

function rootDiff(from: Record<string, unknown>, to: Record<string, unknown>): ObjectDiff {
  return diffInput(
    wrap({_type: 'article', ...from}, {author: AUTHOR}),
    wrap({_type: 'article', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

const noopWrapper = (props: {children: ReactNode}) => props.children

/** A second, distinct valid-shaped image asset, resolvable in the preview store, so the
 * "changed" story swaps between two REAL assets rather than reusing one ref for both sides. */
const SECOND_IMAGE_REF = 'image-Qw3Nx7ZbKpLmR2vTgY8sDeFh4jKpN1mQ-1600x900-jpg'
const secondImageAsset: SanityDocument = {
  _id: SECOND_IMAGE_REF,
  _type: 'sanity.imageAsset',
  _rev: 'rev-image-2',
  _createdAt: '2026-06-01T10:00:00Z',
  _updatedAt: '2026-06-01T10:00:00Z',
  originalFilename: 'harbor-at-dusk.jpg',
  url: `https://cdn.sanity.io/images/mock-project-id/mock-data-set/${SECOND_IMAGE_REF.slice(6)}.jpg`,
  path: `images/mock-project-id/mock-data-set/${SECOND_IMAGE_REF.slice(6)}.jpg`,
  assetId: SECOND_IMAGE_REF.slice(6, -10),
  extension: 'jpg',
  mimeType: 'image/jpeg',
  sha1hash: SECOND_IMAGE_REF.slice(6, -10),
  size: 1_233_009,
  metadata: {},
} as SanityDocument

/** Valid-shaped (passes `@sanity/asset-utils`' id pattern, so `getImageDimensions` does not
 * throw) but never seeded into the preview store - resolves to `null`, i.e. a genuinely
 * deleted asset. Offline and deterministic: no image request is even attempted for this one,
 * since `ImagePreview` gates its `<img>` on `!assetIsDeleted`. */
const DELETED_IMAGE_REF = 'image-Zk9VbNq4WmXpR7sT2eYcAoLj8fHc6dNr-800x600-jpg'

const secondImageValue = {_type: 'image', asset: {_type: 'reference', _ref: SECOND_IMAGE_REF}}
const deletedImageValue = {_type: 'image', asset: {_type: 'reference', _ref: DELETED_IMAGE_REF}}

/**
 * Provides `DocumentChangeContext` around a real field-level diff, without going through
 * `buildObjectChangeList` (which the sibling `ChangeResolver` page uses) - that builder
 * SKIPS unchanged fields entirely, so the only way to reach `ImageFieldDiff`'s own
 * `!isChanged` branch is to read `diff.fields.cover` directly off the root diff, exactly as
 * `DiffFromTo`/`JsonFieldDiff` read their own field off `root.fields`.
 */
function ImageDiffStage({
  from,
  to,
  render,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
  render: (fieldDiff: Diff | undefined, coverType: ObjectSchemaType | undefined) => ReactNode
}) {
  const schema = useSchema()
  const schemaType = schema.get('article') as ObjectSchemaType
  const coverType = schemaType?.fields.find((f) => f.name === 'cover')?.type as
    | ObjectSchemaType
    | undefined
  const diff = useMemo(() => rootDiff(from, to), [from, to])

  return (
    <DocumentChangeContext.Provider
      value={{
        documentId: 'doc-1',
        schemaType,
        rootDiff: diff,
        isComparingCurrent: false,
        FieldWrapper: noopWrapper as never,
        value: {_type: 'article', ...to} as Partial<SanityDocument>,
        showFromValue: true,
      }}
    >
      {render(diff.fields.cover, coverType)}
    </DocumentChangeContext.Provider>
  )
}

function Harness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  return (
    <ImageDiffStage
      from={from}
      to={to}
      render={(fieldDiff, coverType) => {
        if (!fieldDiff || !coverType) {
          return (
            <Card border padding={3} radius={0} tone="caution" style={{maxWidth: 480}}>
              <Text size={1}>
                The differ produced no change for this field, so ImageFieldDiff is never called for
                this pair. That absence is the answer for this pair.
              </Text>
            </Card>
          )
        }
        return (
          <Card border padding={3} radius={0} style={{maxWidth: 480}}>
            <ImageFieldDiff diff={fieldDiff as ObjectDiff<Image>} schemaType={coverType} />
          </Card>
        )
      }}
    />
  )
}

function Row({
  label,
  note,
  ...rest
}: {
  label: string
  note: string
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      <Harness {...rest} />
    </Stack>
  )
}

const CASES = {
  added: {from: {}, to: {cover: boundImageValue}},
  removed: {from: {cover: boundImageValue}, to: {}},
  changed: {from: {cover: boundImageValue}, to: {cover: secondImageValue}},
  unchanged: {from: {cover: boundImageValue}, to: {cover: boundImageValue}},
  deleted: {from: {}, to: {cover: deletedImageValue}},
  metaChanged: {
    from: {
      cover: {
        ...boundImageValue,
        hotspot: {_type: 'sanity.imageHotspot', x: 0.5, y: 0.5, width: 1, height: 1},
      },
    },
    to: {
      cover: {
        ...boundImageValue,
        hotspot: {_type: 'sanity.imageHotspot', x: 0.28, y: 0.62, width: 0.4, height: 0.35},
      },
    },
  },
  subfieldChanged: {
    from: {cover: {...boundImageValue, alt: 'A quiet harbor at dawn'}},
    to: {cover: {...boundImageValue, alt: 'A quiet harbor at dawn, boats moored'}},
  },
} as const

const meta: Meta = {
  title: 'Lists & Data/ImageFieldDiff',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A dead branch here is lower-stakes than the ChangeResolver and MemberField instances ' +
            'of the same shape: it never withholds information from anyone, it just ships an ' +
            'unreachable translation into every locale. The finding is filed for completeness, ' +
            'not urgency.',
          '',
          '|          |                                                                                                                                              |',
          '| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |',
          '| Source   | `packages/sanity/src/core/field/types/image/diff/ImageFieldDiff.tsx`                                                                         |',
          '| Tier     | SERVICE. The Review Changes renderer for every image field, one level below `FieldChange` in the dispatch chain this series has been tracing |',
          '| Audit    | 🟡 needs-work (`change-visibility`). One translated string is shipped to every locale for a branch that cannot run                           |',
          '| Patterns | `change-visibility`                                                                                                                          |',
          '',
          'What Review Changes draws for an image field: the asset before/after, an ' +
            'added/removed/changed label, and (separately) any crop/hotspot or custom-subfield ' +
            'change underneath it.',
          '',
          "**Mocking boundary (read honestly), matching `Forms & Input/ImageInput`'s own note " +
            'for the same reason.** `ImagePreview` (the sub-component every branch below routes ' +
            'into) builds its `<img src>` by calling ' +
            '`createImageUrlBuilder(client).image(id)...`, an algorithmic `cdn.sanity.io` URL ' +
            "built from the asset id and the client's project/dataset, not a read of the asset " +
            "document's own `url` field. That is a different, harder boundary than " +
            '`static/fixture-cover.svg` solves (that fixture serves a component whose `src` is ' +
            '`asset.url` directly). So in every story below: the asset document resolves offline ' +
            'through the seeded preview store, title, "deleted" detection, and the ' +
            'added/removed/changed dispatch all come from that and are genuinely verified, but ' +
            'the pixel request cannot resolve in this environment. Depending on how the runtime ' +
            'handles the failed request, the image area either holds mid-load or (this component, ' +
            "unlike `ImageInput`'s preview, has an explicit `onError` handler) falls through to " +
            'its own "Error loading image" text. Either is the honest, real behaviour of a ' +
            'request that cannot complete offline, not a broken story.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>The confirmed finding: `!from && !to` cannot be reached.</b></summary>',
          '',
          '`from` and `to` (lines ~56-85) are ternary expressions, and both arms of each ' +
            'ternary return a JSX element, `<DiffCard><ImagePreview /></DiffCard>` on one side, ' +
            '`<NoImagePreview />` on the other. A JSX element is always a truthy object; there is ' +
            'no arm of either ternary that can produce `undefined`, `null`, or `false`. So `if ' +
            "(!from && !to)` (line 87) can never be true, and `t('changes.image.no-asset-set')`, " +
            'defined once, at `core/i18n/bundles/studio.ts:375` (`"Image not set"`), referenced ' +
            'nowhere else in the codebase, is a translated string in every locale bundle that ' +
            'cannot appear on screen. Independently verified by reading the file: this is ' +
            'correct.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The two real "nothing to compare" states already have their own ' +
            'renderers, which is presumably why the guard was never exercised into ' +
            'existence.</b></summary>',
          '',
          'An added image (no `fromRef`) already shows `<NoImagePreview />` on the from side ' +
            'inside the normal `FromTo` layout; a document with no cover at all simply never ' +
            'reaches this component (no field, no diff, no dispatch). The unreachable branch ' +
            'would only have fired for a third situation, both sides genuinely empty and ' +
            '`isChanged` true, which the ternaries themselves rule out from ever producing.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The nested-changes path is not the crop/hotspot path.</b></summary>',
          '',
          '`nestedFields` (line ~36-40) filters `schemaType.fields` to names outside ' +
            '`BASE_IMAGE_FIELDS` (`asset`, `media`, `crop`, `hotspot`), i.e. a custom subfield ' +
            'someone added to the image type, like `alt`. Crop and hotspot changes never reach ' +
            'the nested `<ChangeList>`; they are drawn inside `ImagePreview` itself via ' +
            '`<HotspotCropSVG>`, gated by `showMetaChange`/`didHotspotChange`/`didCropChange`. ' +
            'Two different mechanisms for two different kinds of "something else about this image ' +
            'changed", easy to conflate from the outside. `MetadataChanged` and `SubfieldChanged` ' +
            'below are deliberately separate stories for this reason.',
          '',
          '</details>',
          '',
          '> **Why it matters:** filed as the same pattern for completeness, not urgency: a ' +
            'dead branch never withholds information from anyone here, but it is the same ' +
            'guard-for-a-state-that-cannot-occur shape this series keeps finding elsewhere, where ' +
            'the stakes are higher.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      previewStore: createMockDocumentPreviewStore({
        documents: [...imageAssetFixtures, secondImageAsset],
      }),
    }),
  ],
  tags: [
    'autodocs',
    'chapter:data',
    'pattern:change-visibility',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** Every branch this page could confirm, side by side. */
export const OutcomeMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1570px tall, so
  // 1030px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1594px'}}},
  render: () => (
    <Stack gap={5} style={{maxWidth: 620}}>
      <Row
        label="Added"
        note="No fromRef: NoImagePreview on the from side, ImagePreview (pixels narrated) on the to side, wrapped in a DiffTooltip labelled Added."
        {...CASES.added}
      />
      <Row
        label="Removed"
        note="No toRef. Mirror of Added - distinguished on screen only by the tooltip label and which side is empty."
        {...CASES.removed}
      />
      <Row
        label="Changed"
        note="Two different, real asset refs. assetAction = 'changed', both previews attempted."
        {...CASES.changed}
      />
      <Row
        label="Unchanged (bare preview branch)"
        note="Same ref both sides. Only reachable by reading the field diff directly - the real ChangeList builder skips unchanged fields entirely, so this branch never fires through the normal panel."
        {...CASES.unchanged}
      />
      <Row
        label="Deleted asset"
        note="Valid-shaped ref, never seeded into the preview store. Resolves to null, offline and deterministic - no pixel request is even attempted."
        {...CASES.deleted}
      />
      <Row
        label="Metadata changed (hotspot, same asset)"
        note="didAssetChange is false, so no DiffTooltip wrapper; the hotspot values are handed into ImagePreview's own HotspotCropSVG overlay."
        {...CASES.metaChanged}
      />
      <Row
        label="Custom subfield changed (alt text)"
        note="Neither the asset nor crop/hotspot changed. Reaches the OTHER nested-changes mechanism: a recursive ChangeList for the 'alt' field."
        {...CASES.subfieldChanged}
      />
    </Stack>
  ),
}

/** No `fromRef`: the from side is `NoImagePreview`, the to side attempts the real preview,
 * and the pair is wrapped in a `DiffTooltip` labelled "Added". */
export const AssetAdded: Story = {
  name: 'Asset added',
  render: () => <Harness {...CASES.added} />,
}

/** No `toRef`. Compare with `AssetAdded`: on screen the only difference is which side is
 * `NoImagePreview` and the tooltip's label. */
export const AssetRemoved: Story = {
  name: 'Asset removed',
  render: () => <Harness {...CASES.removed} />,
}

/** Two different, real asset refs, both resolvable in the seeded preview store. */
export const AssetChanged: Story = {
  name: 'Asset changed',
  render: () => <Harness {...CASES.changed} />,
}

/**
 * `isChanged` is `false`: the bare-preview branch (line ~97), reachable only by reading
 * `diff.fields.cover` directly. The real `ChangeList`/`buildObjectChangeList` pipeline
 * filters unchanged fields out of the change tree entirely (`buildFieldChange` in
 * `changes/buildChangeList.ts`), so this branch never fires through the normal panel - the
 * same shape of finding `JsonFieldDiff`'s own `Unchanged` story made about its sibling.
 */
export const AssetUnchanged: Story = {
  name: 'Asset unchanged (bare preview branch)',
  render: () => <Harness {...CASES.unchanged} />,
}

/**
 * A valid-shaped ref (passes the asset-id pattern, so nothing throws) that was never seeded
 * into the preview store. `useDocumentValues` settles to `null`, `assetIsDeleted` is `true`,
 * and `ImagePreview` never even attempts an `<img>` request - fully offline, fully
 * deterministic, unlike every other story on this page.
 */
export const DeletedAsset: Story = {
  name: 'Deleted asset (offline, deterministic)',
  render: () => <Harness {...CASES.deleted} />,
}

/**
 * Same asset both sides; only the hotspot changed. `didAssetChange` is `false`, so this is
 * the one changed-image case with NO `DiffTooltip` wrapper - the hotspot values are handed
 * straight into `ImagePreview`'s own `HotspotCropSVG` overlay instead.
 */
export const MetadataChanged: Story = {
  name: 'Metadata changed (hotspot, same asset)',
  render: () => <Harness {...CASES.metaChanged} />,
}

/**
 * Same asset, same crop/hotspot; only the custom `alt` subfield changed. Reaches the OTHER
 * nested-changes mechanism - `nestedFields.length > 0` - which renders a real, recursive
 * `<ChangeList>` for `alt`. Not the same code path as `MetadataChanged`, even though both read
 * as "something about this image changed".
 *
 * There is NO image preview above that list, which this docblock previously claimed there was.
 * `showImageDiff = didAssetChange || didMetaChange` (`ImageFieldDiff.tsx:110`) is false in
 * exactly this state, so the preview does not render at all. The component knows it:
 * `marginTop={showImageDiff ? 4 : 3}` on the very next line adjusts the spacing for its absence.
 * A reviewer sees the alt text change with no picture of the image it belongs to.
 */
export const SubfieldChanged: Story = {
  name: 'Custom subfield changed (nested ChangeList)',
  render: () => <Harness {...CASES.subfieldChanged} />,
}
