import {type SanityClient} from '@sanity/client'
import {
  type ObjectSchemaType,
  type ReferenceSchemaType,
  type SanityDocument,
  type StringSchemaType,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
import {
  type Diff,
  type ObjectDiff,
  type ReferenceDiff,
  type StringDiff,
} from '../../../../packages/sanity/src/core/field/types'
// Real components from real paths (org contract §8): the three siblings this page compares.
import {FileFieldDiff} from '../../../../packages/sanity/src/core/field/types/file/diff/FileFieldDiff'
import {type File} from '../../../../packages/sanity/src/core/field/types/file/diff/types'
import {ReferenceFieldDiff} from '../../../../packages/sanity/src/core/field/types/reference/diff/ReferenceFieldDiff'
import {StringFieldDiff} from '../../../../packages/sanity/src/core/field/types/string/diff/StringFieldDiff'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {createMockSanityClient} from '../../../../packages/sanity/test/mocks/mockSanityClient'
import {createMockDocumentPreviewStore, fixtureDocuments} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Why one client override, on top of the usual preview store ─────────────
   `ReferenceFieldDiff` resolves through `ReferencePreview` → the shared `Preview` component →
   `useValuePreview` → the `DocumentPreviewStore` - the same seam every other reference/preview
   story in this catalog seeds with `previewStore`. `FileFieldDiff` does NOT: it calls
   `useRefValue(assetRef)` (`field/diff/hooks/useRefValue.ts`), which goes straight to
   `client.observable.getDocument(id).subscribe(...)` and never touches the preview store at all.
   `createMockSanityClient()` (`packages/sanity/test/mocks/mockSanityClient.ts`) has
   `observable.getDocuments` (plural, batch) but no singular `getDocument` - calling it on the
   stock mock throws `Cannot read properties of undefined (reading 'subscribe')`. So this page
   hands `WithStudioProviders` a client with `observable.getDocument` added, resolving two fixture
   file-asset documents by id. Nothing here reaches an `<img>`/pixel request the way
   `ImageFieldDiff`'s asset preview does - `MetaInfo` renders text (filename, byte size) - so once
   the asset DOCUMENT resolves, the file states are fully offline and deterministic, unlike the
   image page's honestly-narrated pixel-request gap. */

const AUTHOR = 'ada'

const PREV_FILE_ID = 'file-4a7c1e9b2d6f8a3c5e7b9d1f3a5c7e9b1d3f5a7c-pdf'
const NEXT_FILE_ID = 'file-8b2d4f6a0c2e4a6c8e0a2c4e6a8c0e2a4c6e8a0c-pdf'
const ZERO_BYTE_FILE_ID = 'file-0f1e2d3c4b5a6978869604132435465768798a0-pdf'

const prevFileAsset: SanityDocument = {
  _id: PREV_FILE_ID,
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-1',
  _createdAt: '2026-05-01T09:00:00Z',
  _updatedAt: '2026-05-01T09:00:00Z',
  originalFilename: 'q3-partner-brief-draft.pdf',
  url: `https://cdn.sanity.io/files/mock-project-id/mock-data-set/${PREV_FILE_ID.slice(5, -4)}.pdf`,
  size: 842_000,
  extension: 'pdf',
  mimeType: 'application/pdf',
} as SanityDocument

const nextFileAsset: SanityDocument = {
  _id: NEXT_FILE_ID,
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-2',
  _createdAt: '2026-05-14T09:00:00Z',
  _updatedAt: '2026-05-14T09:00:00Z',
  originalFilename: 'q3-partner-brief-final.pdf',
  url: `https://cdn.sanity.io/files/mock-project-id/mock-data-set/${NEXT_FILE_ID.slice(5, -4)}.pdf`,
  size: 1_204_500,
  extension: 'pdf',
  mimeType: 'application/pdf',
} as SanityDocument

/**
 * A "real" 0-byte asset - a legitimate (if corrupt/empty) upload, not an absent one. `size: 0`
 * is falsy in JS, and `getSizeDiff`'s `if (!prev || !next) return 0` guard (`file/diff/helpers.ts:12`)
 * cannot distinguish "no previous size to compare" (a genuine `Added`) from "the previous size
 * WAS a number, and that number happened to be zero". Both collapse to the same `0`.
 */
const zeroByteFileAsset: SanityDocument = {
  _id: ZERO_BYTE_FILE_ID,
  _type: 'sanity.fileAsset',
  _rev: 'rev-file-0',
  _createdAt: '2026-04-20T09:00:00Z',
  _updatedAt: '2026-04-20T09:00:00Z',
  originalFilename: 'q3-partner-brief-corrupted.pdf',
  url: `https://cdn.sanity.io/files/mock-project-id/mock-data-set/${ZERO_BYTE_FILE_ID.slice(5, -4)}.pdf`,
  size: 0,
  extension: 'pdf',
  mimeType: 'application/pdf',
} as SanityDocument

const fileAssetsById = new Map(
  [prevFileAsset, nextFileAsset, zeroByteFileAsset].map((doc) => [doc._id, doc]),
)

/** `createMockSanityClient()` plus the one method `useRefValue` needs that it doesn't ship. */
function createFileAssetClient(): SanityClient {
  const client = createMockSanityClient() as unknown as SanityClient & {
    observable: Record<string, unknown>
  }
  Object.assign(client.observable, {
    getDocument: (id: string) => of(fileAssetsById.get(id)),
  })
  return client as unknown as SanityClient
}

const schemaTypes = [
  {
    // Reused verbatim from `lib/mockDocumentPreviewStore.ts`'s shared fixture universe
    // (org contract §6: no second mock) - `author-austen` and `author-tolstoy` are real,
    // resolvable fixtures there, and `author-missing` is deliberately absent for the
    // nonexistent-target case below.
    name: 'author',
    title: 'Author',
    type: 'document',
    preview: {select: {title: 'name', subtitle: 'era'}},
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'era', title: 'Era', type: 'string'},
    ],
  },
  {
    name: 'briefing',
    title: 'Briefing',
    type: 'document',
    fields: [
      {name: 'headline', title: 'Headline', type: 'string'},
      {
        name: 'status',
        title: 'Status',
        type: 'string',
        // `{title, value}` pairs, not bare strings - so the enum-diff story can show whether
        // the review pane draws the configured TITLE or the stored VALUE.
        options: {
          list: [
            {title: 'Draft', value: 'draft'},
            {title: 'In review', value: 'in-review'},
            {title: 'Published', value: 'published'},
          ],
        },
      },
      {
        name: 'attachment',
        title: 'Attachment',
        type: 'file',
        // A custom subfield beyond the built-in `asset` - unlike `image`, `file` ships no
        // built-in meta fields of its own (no hotspot/crop equivalent), so this is the ONLY way
        // to reach FileFieldDiff's `nestedFields.length > 0` branch (lines 121-125) at all.
        fields: [{name: 'caption', title: 'Caption', type: 'string'}],
      },
      {name: 'owner', title: 'Owner', type: 'reference', to: [{type: 'author'}]},
    ],
  },
]

function briefingFieldDiff(
  fieldName: string,
  from: Record<string, unknown>,
  to: Record<string, unknown>,
): Diff | undefined {
  return briefingRootDiff(from, to).fields[fieldName]
}

/**
 * The whole-document diff, not just one field's.
 *
 * `FileFieldDiff`'s nested-subfield branch renders a `ChangeList`, which calls
 * `useDocumentChange()`. Mounting the component bare works for every branch that does not reach
 * that path and throws "DocumentChange: missing context value" for the one that does, so the
 * harness supplies the same context `DiffStage` does.
 */
function briefingRootDiff(from: Record<string, unknown>, to: Record<string, unknown>): ObjectDiff {
  return diffInput(
    wrap({_type: 'briefing', ...from}, {author: AUTHOR}),
    wrap({_type: 'briefing', ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

function fileValue(id: string) {
  return {_type: 'file', asset: {_type: 'reference', _ref: id}}
}

function refValue(id: string) {
  return {_type: 'reference', _ref: id}
}

const FILE_CASES = {
  added: {from: {}, to: {attachment: fileValue(NEXT_FILE_ID)}},
  removed: {from: {attachment: fileValue(PREV_FILE_ID)}, to: {}},
  replaced: {
    from: {attachment: fileValue(PREV_FILE_ID)},
    to: {attachment: fileValue(NEXT_FILE_ID)},
  },
  // Same asset both sides; only the custom `caption` subfield changed. Reaches
  // `nestedFields.length > 0` with `didAssetChange` false - the ONLY way into that branch,
  // since a bare `file` type has no built-in meta fields to change instead.
  captionOnly: {
    from: {attachment: {...fileValue(PREV_FILE_ID), caption: 'Signed copy'}},
    to: {attachment: {...fileValue(PREV_FILE_ID), caption: 'Signed copy (v2)'}},
  },
  // A real, non-empty replacement, except the PREVIOUS asset happens to be a genuine 0-byte
  // upload - `size: 0`, not "no previous asset". Demonstrates `getSizeDiff`'s falsy-zero guard.
  replacedFromZeroBytes: {
    from: {attachment: fileValue(ZERO_BYTE_FILE_ID)},
    to: {attachment: fileValue(NEXT_FILE_ID)},
  },
} as const

const STRING_CASES = {
  freeText: {
    from: {headline: 'Board deck moves to Thursday'},
    to: {headline: 'Board deck moves to Thursday afternoon'},
  },
  enumField: {from: {status: 'draft'}, to: {status: 'published'}},
} as const

const REFERENCE_CASES = {
  changed: {from: {owner: refValue('author-austen')}, to: {owner: refValue('author-tolstoy')}},
  added: {from: {}, to: {owner: refValue('author-austen')}},
  removed: {from: {owner: refValue('author-austen')}, to: {}},
  targetDeleted: {
    from: {owner: refValue('author-austen')},
    // `author-missing` is not in `fixtureDocuments` - the fixture universe's own convention
    // for "this id was never seeded" (see its docblock).
    to: {owner: refValue('author-missing')},
  },
} as const

function EmptyNote(props: {children: ReactNode}) {
  return (
    <Card border padding={3} radius={0} tone="caution" style={{maxWidth: 480}}>
      <Text size={1}>{props.children}</Text>
    </Card>
  )
}

function FileHarness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  const schema = useSchema()
  const briefingType = schema.get('briefing') as ObjectSchemaType
  const attachmentType = briefingType?.fields.find((f) => f.name === 'attachment')?.type as
    | ObjectSchemaType
    | undefined
  const diff = briefingFieldDiff('attachment', from, to) as ObjectDiff<File> | undefined

  if (!diff || !attachmentType) {
    return (
      <EmptyNote>
        The differ produced no change for this field, so FileFieldDiff is never called for this
        pair.
      </EmptyNote>
    )
  }

  return (
    <Card border padding={3} radius={0} style={{maxWidth: 480}}>
      <DocumentChangeContext.Provider
        value={{
          documentId: 'briefing-1',
          schemaType: briefingType,
          rootDiff: briefingRootDiff(from, to),
          isComparingCurrent: false,
          FieldWrapper: (({children}: {children: ReactNode}) => children) as never,
          value: {_type: 'briefing', ...to} as Partial<SanityDocument>,
          showFromValue: true,
        }}
      >
        <FileFieldDiff diff={diff} schemaType={attachmentType} />
      </DocumentChangeContext.Provider>
    </Card>
  )
}

function StringHarness({
  field,
  from,
  to,
}: {
  field: 'headline' | 'status'
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  const schema = useSchema()
  const briefingType = schema.get('briefing') as ObjectSchemaType
  const fieldType = briefingType?.fields.find((f) => f.name === field)?.type as
    | StringSchemaType
    | undefined
  const diff = briefingFieldDiff(field, from, to) as StringDiff | undefined

  if (!diff || !fieldType) {
    return (
      <EmptyNote>
        The differ produced no change for this field, so StringFieldDiff is never called for this
        pair.
      </EmptyNote>
    )
  }

  return (
    <Card border padding={3} radius={0} style={{maxWidth: 480}}>
      <StringFieldDiff diff={diff} schemaType={fieldType} />
    </Card>
  )
}

function ReferenceHarness({
  from,
  to,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  const schema = useSchema()
  const briefingType = schema.get('briefing') as ObjectSchemaType
  const ownerType = briefingType?.fields.find((f) => f.name === 'owner')?.type as
    | ReferenceSchemaType
    | undefined
  const diff = briefingFieldDiff('owner', from, to) as ReferenceDiff | undefined

  if (!diff || !ownerType) {
    return (
      <EmptyNote>
        The differ produced no change for this field, so ReferenceFieldDiff is never called for this
        pair.
      </EmptyNote>
    )
  }

  return (
    <Card border padding={3} radius={0} style={{maxWidth: 480}}>
      <ReferenceFieldDiff diff={diff} schemaType={ownerType} />
    </Card>
  )
}

function Row(props: {label: string; note: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {props.label}
      </Text>
      <Text muted size={1}>
        {props.note}
      </Text>
      {props.children}
    </Stack>
  )
}

function SectionHeading(props: {children: ReactNode}) {
  return (
    <Text size={1} weight="bold" style={{textTransform: 'uppercase', letterSpacing: '0.05em'}}>
      {props.children}
    </Text>
  )
}

const meta: Meta = {
  title: 'Lists & Data/File, String and Reference Diffs',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'A reviewer comparing a before and after cannot tell a linked document that still exists ' +
            'but nobody titled it from one that is gone entirely: both read as Untitled. For a ' +
            'reference field, that distinction is the one thing Review Changes exists to preserve.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `FileFieldDiff.tsx` · `StringFieldDiff.tsx` · `ReferenceFieldDiff.tsx` (`packages/sanity/src/core/field/types/{file,string,reference}/diff/`) |',
          '| Tier | SERVICE. Three siblings of `ImageFieldDiff` (see that page for the fourth): the leaf renderers the Review Changes dispatch chain hands a file, string, or reference field diff to |',
          '| Audit | 🟡 needs-work (`change-visibility`). A reference to a deleted document renders identically to a reference to an untitled one |',
          '| Patterns | `change-visibility` |',
          '',
          "Three of Review Changes' field-level renderers, one page: what changes when a file is swapped, when text is edited (or a status field is switched from a fixed list), and when a reference moves from one document to another.",
          '',
          'Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so every case below supplies two plain documents and the real differ decides `action`, `fromValue`, and `toValue`. A fabricated `Diff` literal would satisfy the type and skip the only interesting part.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>File: a replacement and a first upload are distinguishable on two independent signals, and the size badge has a silent blind spot.</b></summary>',
          '',
          '`from`/`to` (lines 57-91) are each built once and reused across three branches (96-115): removed-only wraps `from` alone in a `DiffTooltip` labelled "Removed" (`t(\'changes.removed-label\')`, line 97); added-only wraps `to` alone labelled "Added" (line 111); a genuine replacement (`from && to`, lines 103-107) renders both `MetaInfo` cards, old filename and new filename, side by side in `FromTo` grid layout with an arrow between them, and its `DiffTooltip` passes no `description` at all, which `DiffTooltip.tsx:52` falls back to `t(\'changes.changed-label\')`, i.e. "Changed". So a reviewer can tell them apart by shape (one card versus two-with-an-arrow) and by label ("Added"/"Removed" versus "Changed"). `getSizeDiff` has exactly one call site, `FileFieldDiff.tsx:51`, and its result gates the badge with `pctDiff !== 0` (line 80): when the guard fires there is no "0%" and no "no change" text, the badge element simply is not in the tree. `getSizeDiff` (`helpers.ts:11-20`) returns that same `0` for two different reasons: genuinely no prior size to compare (`Added`, correct), or a prior size that was a number and happened to be `0` (`!prev` is true for `0`, a bug). Both are storied below (`FileReplaced` has a badge; `FileSizeBadgeSuppressedAtZeroBytes` does not, despite an 842KB real change): a reviewer cannot tell "nothing to compare" from "the size comparison silently failed" from the row alone, the same collapse-of-distinct-causes shape as the reference finding below.',
          '',
          "Nested subfields: `nestedFields.length > 0` (line 121) is gated independently by `didAssetChange` (line 45), exactly like `ImageFieldDiff`'s `showImageDiff` gates its own asset preview, so when only a custom subfield changes (a `caption` field added to the schema below; a bare `file` type ships no built-in meta fields the way `image` ships hotspot/crop, so this is the only door into that branch), the asset panel does not render at all, matching `ImageFieldDiff`'s identical gating. It reads correctly: nothing implies the file itself changed when it did not (`FileCaptionOnly` below). The cost is silence, not a false claim: the row shows the caption's own change with no filename anchor, because `FileFieldDiff` never renders an unchanged-asset preview for context.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>String: the second state is any select/radio-style field, and it shows the stored value, not the configured label.</b></summary>',
          '',
          '`options?.list` (line 15) is the only branch condition: unset, it renders `DiffString`, `@sanity/diff`\'s own word-level segmentation (`field/diff/components/DiffString.tsx:78-92`), each inserted/removed run in its own `DiffCard`. Set, it renders `DiffFromTo` with `StringPreview` instead, an atomic swap, no segment diff. This is reachable by any ordinary "status"-style field, not an edge case. What reading `StringPreview` (`string/preview/StringPreview.tsx:12-20`) turned up: it renders `value` verbatim. When `options.list` entries are `{title, value}` pairs (as configured below), the field\'s own input shows the editor the title ("Published"); Review Changes shows the reviewer the stored value ("published"). Two different vocabularies for the same field, one screen apart.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Reference: always one render; the interesting question is what it resolves to.</b></summary>',
          '',
          '`ReferenceFieldDiff.tsx:5-16` is unconditional: `DiffFromTo` in `grid` layout with `ReferencePreview`. `ReferencePreview` (`reference/preview/ReferencePreview.tsx:12-16`) hands the raw `{_ref}` straight to the shared `Preview` component, which resolves the referenced document\'s own preview (title, not id) through `useValuePreview` → `createPreviewObserver` (`preview/createPreviewObserver.ts:77-101`, the `isReferenceSchemaType` branch). When the id does not resolve, deleted, or simply never existed, `observeDocumentTypeFromId` returns no type, the observer falls through to `{snapshot: undefined}` (line 98), and the renderer shows the ordinary "Untitled" fallback (`DefaultPreview.tsx:133-137`, `preview.default.title-fallback` = "Untitled", `studio.ts:1504`), the exact same text a real, present, merely-untitled document would show.',
          '',
          '</details>',
          '',
          '> **Why it matters:** the linked document still existing but nobody titling it, and the linked document being gone entirely, both read as "Untitled". For a reference field, that distinction is the one thing Review Changes exists to preserve.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      client: createFileAssetClient(),
      previewStore: createMockDocumentPreviewStore({documents: fixtureDocuments}),
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

/** Every state this page could confirm, grouped by component. */
export const OutcomeMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1831px tall, so
  // 1291px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1855px'}}},
  render: () => (
    <Stack gap={6} style={{maxWidth: 640}}>
      <Stack gap={5}>
        <SectionHeading>FileFieldDiff</SectionHeading>
        <Row label="Added" note="No fromRef: a single ins card, labelled Added.">
          <FileHarness {...FILE_CASES.added} />
        </Row>
        <Row label="Removed" note="No toRef: a single del card, labelled Removed.">
          <FileHarness {...FILE_CASES.removed} />
        </Row>
        <Row
          label="Replaced"
          note="Two different, real assets. Both filenames shown side by side with an arrow between them, tooltip falls back to Changed (no explicit label passed)."
        >
          <FileHarness {...FILE_CASES.replaced} />
        </Row>
        <Row
          label="Caption changed, asset unchanged"
          note="didAssetChange is false (same asset ref both sides), so no asset panel renders - only the nested ChangeList for the caption. Reads correctly: nothing implies the file itself changed."
        >
          <FileHarness {...FILE_CASES.captionOnly} />
        </Row>
        <Row
          label="Size badge suppressed (0-byte source)"
          note="A real, 842KB size change - but the PREVIOUS asset's size was a genuine 0, which getSizeDiff's falsy check treats as 'nothing to compare'. No badge renders at all: not 0%, nothing."
        >
          <FileHarness {...FILE_CASES.replacedFromZeroBytes} />
        </Row>
      </Stack>

      <Stack gap={5}>
        <SectionHeading>StringFieldDiff</SectionHeading>
        <Row
          label="Free text"
          note="No options.list: a word-level segment diff (DiffString) - insertions and deletions rendered inline."
        >
          <StringHarness field="headline" {...STRING_CASES.freeText} />
        </Row>
        <Row
          label="Enum (options.list)"
          note="A status field with {title, value} options. Renders the stored VALUE ('draft' -> 'published'), not the configured title ('Draft' -> 'Published')."
        >
          <StringHarness field="status" {...STRING_CASES.enumField} />
        </Row>
      </Stack>

      <Stack gap={5}>
        <SectionHeading>ReferenceFieldDiff</SectionHeading>
        <Row
          label="Changed"
          note="Two different, resolvable documents. Shows each document's own title, never its id."
        >
          <ReferenceHarness {...REFERENCE_CASES.changed} />
        </Row>
        <Row label="Added" note="No fromValue: a single ins card.">
          <ReferenceHarness {...REFERENCE_CASES.added} />
        </Row>
        <Row label="Removed" note="No toValue: a single del card.">
          <ReferenceHarness {...REFERENCE_CASES.removed} />
        </Row>
        <Row
          label="Target deleted between change and review"
          note="The 'to' side points at an id that was never seeded (author-missing). Renders as 'Untitled' - the same fallback a real, present, untitled document would show."
        >
          <ReferenceHarness {...REFERENCE_CASES.targetDeleted} />
        </Row>
      </Stack>
    </Stack>
  ),
}

/** No `fromRef`: a single `ins` card, wrapped in a `DiffTooltip` labelled "Added". */
export const FileAdded: Story = {
  name: 'File: Added',
  render: () => <FileHarness {...FILE_CASES.added} />,
}

/** No `toRef`. Mirror of `FileAdded` - distinguished only by the tooltip label and which side
 * is empty. */
export const FileRemoved: Story = {
  name: 'File: Removed',
  render: () => <FileHarness {...FILE_CASES.removed} />,
}

/**
 * Two different, real assets. Both filenames render, side by side, in `FromTo` grid layout
 * with an arrow between them - the two-card shape is what actually tells a reviewer "this was
 * replaced" apart from "this was added"; the tooltip label ("Changed" by fallback, not an
 * explicit string) is the secondary signal.
 */
export const FileReplaced: Story = {
  name: 'File: Replaced',
  render: () => <FileHarness {...FILE_CASES.replaced} />,
}

/**
 * Same asset both sides; only the custom `caption` subfield changed. `didAssetChange` is
 * `false` (`FileFieldDiff.tsx:45`), so the whole asset panel is skipped - only the nested
 * `ChangeList` for `caption` renders (`nestedFields.length > 0`, lines 121-125). Identical
 * gating to `ImageFieldDiff`'s `showImageDiff`, side by side with `Lists & Data/ImageFieldDiff`'s
 * own `SubfieldChanged` story. Reads correctly: no filename shows, so nothing on screen implies
 * the file itself changed - the cost is an unlabelled row (no filename anchor), not a false claim.
 */
export const FileCaptionOnly: Story = {
  name: 'File: Caption changed, asset unchanged',
  render: () => <FileHarness {...FILE_CASES.captionOnly} />,
}

/**
 * The one call site of `getSizeDiff` (`FileFieldDiff.tsx:51`), fed a genuine 0-byte previous
 * asset rather than a missing one. `if (!prev || !next) return 0` (`helpers.ts:12`) cannot tell
 * "there was no previous size" from "the previous size was zero" - both produce `0`, and
 * `pctDiff !== 0` (line 80) then omits the badge element entirely. Compare with `FileReplaced`:
 * this pair is a real, 842KB size change and shows no percentage at all, not even "0%".
 */
export const FileSizeBadgeSuppressedAtZeroBytes: Story = {
  name: 'File: Size badge suppressed (0-byte source)',
  render: () => <FileHarness {...FILE_CASES.replacedFromZeroBytes} />,
}

/**
 * `options?.list` unset: the free-text branch. `DiffString` renders `@sanity/diff`'s own
 * word-level segments, each insertion/deletion in its own `DiffCard`.
 */
export const StringFreeText: Story = {
  name: 'String: Free text (segment diff)',
  render: () => <StringHarness field="headline" {...STRING_CASES.freeText} />,
}

/**
 * `options.list` set on a `status` field with `{title, value}` entries: the enum branch,
 * `DiffFromTo` + `StringPreview` instead of a segment diff. Reachable by any ordinary
 * select/radio-style field. Renders the stored VALUE ('draft', 'published'), not the
 * configured TITLE the field's own input shows the editor.
 */
export const StringEnum: Story = {
  name: 'String: Enum (options.list)',
  render: () => <StringHarness field="status" {...STRING_CASES.enumField} />,
}

/**
 * The one render `ReferenceFieldDiff` has: `DiffFromTo` in grid layout with
 * `ReferencePreview`. Both sides resolve, so both show the referenced document's own title
 * (`Jane Austen`, `Leo Tolstoy`) - never the raw `_ref` id underneath.
 */
export const ReferenceChanged: Story = {
  name: 'Reference: Changed',
  render: () => <ReferenceHarness {...REFERENCE_CASES.changed} />,
}

/** No `fromValue`. */
export const ReferenceAdded: Story = {
  name: 'Reference: Added',
  render: () => <ReferenceHarness {...REFERENCE_CASES.added} />,
}

/** No `toValue`. */
export const ReferenceRemoved: Story = {
  name: 'Reference: Removed',
  render: () => <ReferenceHarness {...REFERENCE_CASES.removed} />,
}

/**
 * The finding this page exists to surface. The `to` side points at `author-missing`, an id
 * `fixtureDocuments` deliberately never seeds. `observeDocumentTypeFromId` resolves no type,
 * `createPreviewObserver` falls through to an empty snapshot, and the renderer shows the
 * ordinary "Untitled" fallback - identical to a document that exists but has no name filled
 * in. Nothing on screen tells a reviewer the target is gone rather than merely unnamed.
 */
export const ReferenceTargetDeleted: Story = {
  name: 'Reference: Target deleted between change and review',
  render: () => <ReferenceHarness {...REFERENCE_CASES.targetDeleted} />,
}
