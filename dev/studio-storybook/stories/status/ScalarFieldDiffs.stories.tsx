import {UserIcon} from '@sanity/icons/User'
import {
  type BooleanSchemaType,
  type NumberSchemaType,
  type ObjectSchemaType,
  type Reference,
  type SanityDocument,
  type StringSchemaType,
} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ReactNode, useMemo} from 'react'
import {DocumentChangeContext} from 'sanity/_singletons'

// `@sanity/diff` is not a dependency of this storybook package, so Vite cannot resolve the bare
// specifier from here. Deep source import, the convention throughout this storybook.
import {diffInput, wrap} from '../../../../packages/@sanity/diff/src/index'
import {
  type BooleanDiff,
  type NumberDiff,
  type ObjectDiff,
  type StringDiff,
} from '../../../../packages/sanity/src/core/field/types'
// Real components from real paths (org contract §8).
import {BooleanFieldDiff} from '../../../../packages/sanity/src/core/field/types/boolean/diff/BooleanFieldDiff'
import {DatetimeFieldDiff} from '../../../../packages/sanity/src/core/field/types/datetime/diff/DatetimeFieldDiff'
import {NumberFieldDiff} from '../../../../packages/sanity/src/core/field/types/number/diff/NumberFieldDiff'
import {ReferenceFieldDiff} from '../../../../packages/sanity/src/core/field/types/reference/diff/ReferenceFieldDiff'
import {SlugFieldDiff} from '../../../../packages/sanity/src/core/field/types/slug/diff/SlugFieldDiff'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {DiffStage, diffSchemaTypes, diffStudioConfig} from '../../lib/diffHarness'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/* ── Six renderers, two of them shared by two field types each ──────────────
   `BooleanFieldDiff` is the only one with its own layout logic (checkbox/switch, from/to/arrow/
   title, all gated by its own booleans). `DatetimeFieldDiff`, `NumberFieldDiff`, `SlugFieldDiff`
   and `ReferenceFieldDiff` are each a thin delegate to `DiffFromTo` with a type-specific preview
   component - the four `DiffFromTo` outcomes (unchanged/added/removed/changed) are `Lists & Data/
   DiffFromTo`'s subject, not this page's. What IS specific to each delegate is what its preview
   prints, and - for two of the four - what schema type it is actually shared BY:
   `defaultComponents.ts` maps both `date` and `datetime` to `DatetimeFieldDiff`, and both
   `reference` and `crossDatasetReference` to `ReferenceFieldDiff`. Two type pairs, one renderer
   each, and the second half of this page is about whether the shared renderer actually adapts to
   both members of its pair or just happens to work for the one it was probably written against.

   Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))`
   the studio itself calls, so each story supplies two plain documents and the real differ decides
   `action`, `fromValue` and `toValue`. `diffSchemaTypes`'s `article` type covers the first four
   fields; a second document type (`syndication`) and an `author` type are added locally for the
   reference/cross-dataset-reference and date/custom-date comparisons, seeded into a local
   preview store so `ReferenceFieldDiff`'s preview can resolve real fixture documents offline. */

const AUTHOR = 'ada'

function rootDiff(
  typeName: string,
  from: Record<string, unknown>,
  to: Record<string, unknown>,
): ObjectDiff {
  return diffInput(
    wrap({_type: typeName, ...from}, {author: AUTHOR}),
    wrap({_type: typeName, ...to}, {author: AUTHOR}),
  ) as ObjectDiff
}

const noopWrapper = (props: {children: ReactNode}) => props.children

/** Resolves one field's schema type and diff off the real root diff. Shared by every Harness
 * function below so the extraction logic exists once. */
function useFieldDiff(
  typeName: string,
  field: string,
  from: Record<string, unknown>,
  to: Record<string, unknown>,
) {
  const schema = useSchema()
  const parentType = schema.get(typeName) as ObjectSchemaType
  const fieldType = parentType?.fields.find((f) => f.name === field)?.type
  const diff = useMemo(() => rootDiff(typeName, from, to), [typeName, from, to])
  return {parentType, fieldType, fieldDiff: diff.fields[field], diff}
}

function NoChangeCard() {
  return (
    <Card border padding={3} radius={0} tone="caution" style={{maxWidth: 480}}>
      <Text size={1}>
        The differ produced no change for this field, so the diff component is never called for this
        pair. That absence is the answer for this pair.
      </Text>
    </Card>
  )
}

/** Provides the same `DocumentChangeContext` the real Review Changes panel mounts every field
 * diff inside. Only `BooleanFieldDiff` reads it (for `showFromValue`); the others tolerate it
 * being present, same as they do wrapped in the real panel. */
function DiffStageCard({
  parentType,
  diff,
  to,
  showFromValue,
  children,
}: {
  parentType: ObjectSchemaType
  diff: ObjectDiff
  to: Record<string, unknown>
  showFromValue: boolean
  children: ReactNode
}) {
  return (
    <Card border padding={3} radius={0} style={{maxWidth: 480}}>
      <DocumentChangeContext.Provider
        value={{
          documentId: 'doc-1',
          schemaType: parentType,
          rootDiff: diff,
          isComparingCurrent: false,
          FieldWrapper: noopWrapper as never,
          value: {_type: parentType?.name, ...to} as Partial<SanityDocument>,
          showFromValue,
        }}
      >
        {children}
      </DocumentChangeContext.Provider>
    </Card>
  )
}

function BooleanHarness({
  from,
  to,
  showFromValue = true,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
  showFromValue?: boolean
}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('article', 'featured', from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue={showFromValue}>
      <BooleanFieldDiff
        diff={fieldDiff as BooleanDiff}
        schemaType={fieldType as BooleanSchemaType}
      />
    </DiffStageCard>
  )
}

function DatetimeHarness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('article', 'publishedAt', from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      <DatetimeFieldDiff
        diff={fieldDiff as StringDiff}
        schemaType={fieldType as StringSchemaType}
      />
    </DiffStageCard>
  )
}

function NumberHarness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('article', 'readingTime', from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      <NumberFieldDiff diff={fieldDiff as NumberDiff} schemaType={fieldType as NumberSchemaType} />
    </DiffStageCard>
  )
}

function SlugHarness({from, to}: {from: Record<string, unknown>; to: Record<string, unknown>}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('article', 'slug', from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      <SlugFieldDiff
        diff={fieldDiff as ObjectDiff<{current?: string}>}
        schemaType={fieldType as ObjectSchemaType}
      />
    </DiffStageCard>
  )
}

/** `field` picks which `syndication` field to diff: `releaseDate` (an ordinary inline `date`
 * field) or `restrictedUntil` (typed via the separately-registered `customDate`), so `DateChanged`
 * and `DateViaCustomNamedType` share one Harness and differ only in which field they read. */
function DateHarness({
  field,
  from,
  to,
}: {
  field: string
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('syndication', field, from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      <DatetimeFieldDiff
        diff={fieldDiff as StringDiff}
        schemaType={fieldType as StringSchemaType}
      />
    </DiffStageCard>
  )
}

function ReferenceHarness({
  from,
  to,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff('syndication', 'editor', from, to)
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      <ReferenceFieldDiff
        diff={fieldDiff as ObjectDiff<Reference>}
        schemaType={fieldType as ObjectSchemaType}
      />
    </DiffStageCard>
  )
}

function CrossDatasetReferenceHarness({
  from,
  to,
}: {
  from: Record<string, unknown>
  to: Record<string, unknown>
}) {
  const {parentType, fieldType, fieldDiff, diff} = useFieldDiff(
    'syndication',
    'partnerEditor',
    from,
    to,
  )
  if (!fieldDiff || !fieldType) return <NoChangeCard />
  return (
    <DiffStageCard parentType={parentType} diff={diff} to={to} showFromValue>
      {/* Same component as ReferenceHarness above: `ReferenceFieldDiff` is typed against a
          same-dataset `Reference`, but `defaultComponents.ts` hands it `crossDatasetReference`
          diffs unchanged - the cast below matches what the real dispatcher already does. */}
      <ReferenceFieldDiff
        diff={fieldDiff as ObjectDiff<Reference>}
        schemaType={fieldType as ObjectSchemaType}
      />
    </DiffStageCard>
  )
}

function Row({label, note, children}: {label: string; note: string; children: ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {label}
      </Text>
      <Text muted size={1}>
        {note}
      </Text>
      {children}
    </Stack>
  )
}

const CASES = {
  trueToFalse: {from: {featured: true}, to: {featured: false}},
  falseToTrue: {from: {featured: false}, to: {featured: true}},
  fieldAdded: {from: {}, to: {featured: true}},
  fieldCleared: {from: {featured: true}, to: {}},
  datetimeChanged: {
    from: {publishedAt: '2026-01-14T09:30:00.000Z'},
    to: {publishedAt: '2026-07-20T16:45:00.000Z'},
  },
  numberChanged: {from: {readingTime: 4}, to: {readingTime: 11}},
  slugChanged: {
    from: {slug: {_type: 'slug', current: 'the-garden-of-forking-paths'}},
    to: {slug: {_type: 'slug', current: 'the-garden-of-forking-trails'}},
  },
  dateChanged: {from: {releaseDate: '2026-01-14'}, to: {releaseDate: '2026-07-20'}},
  dateCustomType: {
    from: {restrictedUntil: '2026-01-14'},
    to: {restrictedUntil: '2026-07-20'},
  },
  referenceChanged: {
    from: {editor: {_type: 'reference', _ref: 'author-quinn'}},
    to: {editor: {_type: 'reference', _ref: 'author-reyes'}},
  },
  crossDatasetReferenceChanged: {
    from: {
      partnerEditor: {
        _type: 'crossDatasetReference',
        _ref: 'author-quinn',
        _dataset: 'partner-publishing',
        _projectId: 'partner-org',
      },
    },
    to: {
      partnerEditor: {
        _type: 'crossDatasetReference',
        _ref: 'author-reyes',
        _dataset: 'partner-publishing',
        _projectId: 'partner-org',
      },
    },
  },
  // `author-mercer` is a plausible id, deliberately never seeded into `authorFixtures` below -
  // standing in for a document that existed at edit time and was deleted before review.
  referenceToDeletedDoc: {
    from: {editor: {_type: 'reference', _ref: 'author-quinn'}},
    to: {editor: {_type: 'reference', _ref: 'author-mercer'}},
  },
} as const

// A type registered under its own name, extending the builtin `date` - the shape a schema reaches
// for to share a date field's config (format, validation) across several document types.
// `resolveDiffComponent` still finds `DatetimeFieldDiff` for a field typed this way (it walks the
// type chain), but the `schemaType` the mounted component actually receives keeps this name, not
// `date` - see finding 7 in the docblock below.
const customDateType = {name: 'customDate', title: 'Custom date', type: 'date'}

const authorType = {
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [{name: 'name', title: 'Name', type: 'string'}],
}

const syndicationType = {
  name: 'syndication',
  title: 'Syndication',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string'},
    {name: 'releaseDate', title: 'Release date', type: 'date'},
    {name: 'restrictedUntil', title: 'Restricted until', type: 'customDate'},
    {name: 'editor', title: 'Editor', type: 'reference', to: [{type: 'author'}]},
    {
      name: 'partnerEditor',
      title: 'Partner editor',
      type: 'crossDatasetReference',
      dataset: 'partner-publishing',
      to: [
        {
          type: 'author',
          title: 'Author',
          icon: UserIcon,
          preview: {select: {title: 'name'}},
        },
      ],
    },
  ],
}

const scalarSchemaTypes = [...diffSchemaTypes, authorType, customDateType, syndicationType]

/** Two authors, resolvable offline through the seeded preview store. `ReferenceHarness` and
 * `CrossDatasetReferenceHarness` both change `_ref` from one to the other - the same two
 * documents, so the only variable between the two stories is the reference TYPE, not the target. */
const authorFixtures: SanityDocument[] = [
  {
    _id: 'author-quinn',
    _type: 'author',
    _rev: 'rev-quinn-1',
    _createdAt: '2026-01-05T09:00:00Z',
    _updatedAt: '2026-01-05T09:00:00Z',
    name: 'Priya Quinn',
  },
  {
    _id: 'author-reyes',
    _type: 'author',
    _rev: 'rev-reyes-1',
    _createdAt: '2026-01-06T09:00:00Z',
    _updatedAt: '2026-01-06T09:00:00Z',
    name: 'Marco Reyes',
  },
]

const meta: Meta = {
  title: 'Lists & Data/Scalar Field Diffs',
  parameters: {
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Across six renderers, the same shape recurs: a value that genuinely differs from what ' +
            'the renderer assumes gets drawn as if it were the ordinary case, silently. Two of ' +
            'those are live, confirmed bugs: a spurious time appended to a date-only field, and a ' +
            'deleted reference that reads as merely untitled.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `BooleanFieldDiff.tsx` · `DatetimeFieldDiff.tsx` · `NumberFieldDiff.tsx` · `SlugFieldDiff.tsx` · `ReferenceFieldDiff.tsx` · `defaultComponents.ts` / `resolveDiffComponent.ts` (which renderer serves which type) |',
          '| Tier | SERVICE. One level below `FieldChange` in the dispatch chain `Lists & Data/ChangeResolver` traces. Each is what Review Changes draws for one field type, or, for two of these six, for two field types at once |',
          '| Audit | 🔴 needs-work (`change-visibility`). Two live, confirmed rendering bugs (a spurious time on a date-only field; a deleted reference reading as an untitled one) plus the boolean label/glyph findings already filed as ledger #104/#105 |',
          '| Patterns | `change-visibility` |',
          '',
          'Six small renderers for the field kinds a lot of schemas lean on: a toggle, a date, a count, a URL segment, and a same-dataset or cross-dataset pointer to another document.',
          '',
          'Nothing here is hand-authored. `@sanity/diff` exports the same `diffInput(wrap(from), wrap(to))` the studio itself calls, so each story supplies two plain documents and the real differ decides `action`, `fromValue`, and `toValue`.',
          '',
          '**What reading it turned up.**',
          '',
          '<details>',
          '<summary><b>Boolean is the only one of these with its own layout, and direction is visible.</b></summary>',
          '',
          "`BooleanFieldDiff` (lines 15-42) renders `<Preview checked={fromValue} />`, a `FromToArrow`, then `<Preview checked={toValue} />` side by side (lines 19-29), both `Checkbox` and `Switch` (`boolean/preview/BooleanPreview.tsx`) fill or position differently for `true` versus `false` (`fill={checked ? color?.border : color?.background}`), so a true-to-false flip and a false-to-true flip are visibly mirror images, not an unlabelled 'this changed'.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Boolean drops its own label on the one outcome that most needs it, and no outer wrapper covers for it (ledger #104).</b></summary>',
          '',
          '`{showToValue && title && <Text>{title}</Text>}` (line 34) gates the label on `toValue !== undefined && toValue !== null` alone, so a cleared boolean renders an unlabelled checkbox or switch. `boolean` is also the only entry in `defaultComponents.ts` carrying `showHeader: false` (`defaultComponents.ts:17`), which suppresses the shared `ChangeBreadcrumb` header every other type gets by default (`buildChangeList.ts:333-336`), so for booleans specifically, nothing else in the row labels it either.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Boolean\'s "from" side is gated on a document-level flag, not on whether this field actually had a value (ledger #105).</b></summary>',
          '',
          '`{showFromValue && <Preview checked={fromValue} .../>}` (line 19) reads `showFromValue` from `useDocumentChange()`, a per-document flag, not `diff.fromValue !== undefined`, which is the guard `DiffFromTo` uses for the same purpose (`DiffFromTo.tsx` line 51). A boolean field added inside a document that already existed gets `Preview checked={undefined}`, the indeterminate dash/centred-knob glyph (`BooleanPreview.tsx` lines 28-29, 40-41), meant for "genuinely optional and unset," rendered instead for "there was nothing to show." `BooleanFieldAdded` and `BooleanNewDocument` are the same diff with only the flag flipped.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Datetime and Number are bare delegates to `DiffFromTo`.</b></summary>',
          '',
          "`DatetimePreview` calls `legacyDateFormat.format(new Date(value), dateFormat + ' ' + timeFormat)` (`datetime/preview/DatetimePreview.tsx` lines 24-32), defaulting to `'YYYY-MM-DD'` + `'HH:mm'`, an absolute calendar timestamp, never a relative phrase. `NumberPreview` just prints `{value}`, typed `FieldPreviewComponent<string>` even though `NumberDiff`'s values are `number` (`@sanity/diff/src/types.ts:243`), a wrong annotation, not a behavioural bug.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Slug is also a bare delegate, over `SlugPreview`, and it never sees the title that produced it.</b></summary>',
          '',
          '`SlugFieldDiff` receives exactly `diff.fields.slug`; nothing hands it `diff.fields.title`. `SlugFollowsTitleChange` runs both through the real `ChangeList` and shows two independent rows, not one.',
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The date/datetime split works correctly for the case every schema actually writes.</b></summary>',
          '',
          "`defaultComponents.ts` maps both `date` and `datetime` to `DatetimeFieldDiff` (lines 18-19). `resolveDiffComponent` (`resolveDiffComponent.ts` lines 15-26) walks the type chain and, for an ordinary inline `{type: 'date'}` field, matches `defaultComponents['date']` directly, the field's own `schemaType.name` really is `'date'`. `formatDateTime` (`DatetimePreview.tsx` line 31) checks exactly that name and skips the time format. `DateChanged` confirms it: a clean, date-only render, no `00:00`.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>The same check breaks the moment a schema names its own date type, and this is a real, live bug, not a theoretical one.</b></summary>',
          '',
          "`resolveDiffComponent`'s chain-walk (lines 15-26) correctly finds `DatetimeFieldDiff` no matter how many named types sit between a field and `date`, it walks `itType.type` until `defaultComponents[itType.name]` matches. But the `schemaType` prop the resolved component actually receives is never updated to reflect that walk: `buildChangeList.ts`'s `getFieldChange` (lines 300-350) keeps the field's own leaf type, sourced from `buildObjectChangeList`'s `field.type` (line 103), all the way through. So `defineType({name: 'customDate', type: 'date'})`, an ordinary, common pattern for sharing a date field's config across several document types, gets the correct component (`DatetimeFieldDiff`, found by the walk) but the wrong name reaching `formatDateTime`'s check: `schemaType.name` is `'customDate'`, not `'date'`, the `name === 'date'` guard is false, and it falls into the branch that appends the time format. `new Date('2026-07-20')` parses as midnight UTC, so the panel shows a real, wrong-looking time on a field the schema declares has none. `DateViaCustomNamedType` reproduces this exactly.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>Reference and crossDatasetReference render identically, and nothing communicates the boundary a crossDatasetReference actually crosses.</b></summary>',
          '',
          "Both map to `ReferenceFieldDiff` (`defaultComponents.ts` lines 23-24), which delegates to `DiffFromTo` with `ReferencePreview`, the referenced document's own preview, nothing else (`ReferencePreview.tsx` lines 12-16). A `CrossDatasetReferenceValue` carries `_dataset`/`_projectId` (`@sanity/types/src/crossDatasetReference/types.ts` lines 9-16) specifically because the referenced document lives in a different project and dataset, and `createPreviewObserver.ts` (lines 52-76) does route the actual fetch through those fields, but the snapshot that comes back is rendered through the exact same title/media preview as a same-dataset reference, so `_dataset`/`_projectId` are consumed once, to pick an API, and then discarded. `ReferenceChanged` and `CrossDatasetReferenceChanged` below point at the same two fixture documents through the same two ids, changing only the reference type, and render pixel-identically.",
          '',
          '</details>',
          '',
          '<details>',
          '<summary><b>A reference to a document deleted between edit and review shows neither the id nor an error: it shows the word "Untitled," indistinguishable from a real document with no title.</b></summary>',
          '',
          'Traced the whole chain: `ReferencePreview` (`ReferencePreview.tsx:12-16`) hands the reference value to the generic `<Preview layout="default">`, which resolves through `useValuePreview` (`preview/useValuePreview.ts:89`: `value: event.snapshot || undefined`). `createPreviewObserver.ts` (lines 86-99) resolves a reference by first looking up the target\'s `_type` via `observeDocumentTypeFromId`; when the id no longer exists that lookup returns nothing and the observer falls through to `of({snapshot: undefined})`, no thrown error, just an empty snapshot. `PreviewLoader` then spreads `preview?.value || {}` (empty) into the preview component with `error={preview?.error}` (`undefined`) and `isPlaceholder={preview?.isLoading}` (`false`), so `DefaultPreview` (`components/previews/general/DefaultPreview.tsx` lines 130-137) takes its own `{!title && <span>{t(\'preview.default.title-fallback\')}</span>}` branch: the literal string "Untitled." `value._ref`, the one piece of information that would tell a reviewer which document is missing, is never read by any component in this chain. Same path for `crossDatasetReference`: `createPreviewObserver.ts` lines 61-75 fall through to the identical `of({snapshot: undefined})` when the cross-dataset lookup fails. `ReferenceToDeletedDocument` reproduces this with `author-mercer`, a plausible id deliberately never seeded into the fixture store.',
          '',
          '</details>',
          '',
          "> **Why it matters:** several of these findings share a shape: a value that genuinely differs from the renderer's assumed case gets drawn as if it were the common one, silently. The custom-named date type is the most serious of them, reachable by any schema that names a reusable date type, a common pattern, and it produces a visibly wrong timestamp with no error, warning, or fallback. The deleted reference is close behind: a broken reference and an untitled-but-real one are visually identical, and the id that would resolve the ambiguity is discarded earlier in the chain. The cross-dataset reference finding is different in kind, not a bug so much as an absent signal, worth a decision rather than necessarily a defect to fix.",
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {...diffStudioConfig, schema: {name: 'storybook', types: scalarSchemaTypes}},
      previewStore: createMockDocumentPreviewStore({documents: authorFixtures}),
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

/**
 * `featured` flips from `true` to `false`. `BooleanFieldDiff` renders both states side by side
 * with an arrow between them, so the direction is on the canvas, not just in a tooltip.
 */
export const BooleanTrueToFalse: Story = {
  name: 'Boolean: true → false',
  render: () => <BooleanHarness {...CASES.trueToFalse} />,
}

/** The mirror of the story above. Put the two next to each other: the fill and knob position
 * invert, confirming the direction reads correctly both ways, not just in the one case tested. */
export const BooleanFalseToTrue: Story = {
  name: 'Boolean: false → true',
  render: () => <BooleanHarness {...CASES.falseToTrue} />,
}

/**
 * A boolean field gets its first value inside a document that already existed. `fromValue` is
 * `undefined`, `showFromValue` (document-level) is `true`, so `Preview` is called with
 * `checked={undefined}` - the indeterminate dash/centred-knob glyph, not an empty from side.
 * Compare with `BooleanNewDocument`: same diff, only the context flag differs.
 */
export const BooleanFieldAdded: Story = {
  name: 'Boolean: field added (existing document)',
  render: () => <BooleanHarness {...CASES.fieldAdded} />,
}

/**
 * A boolean field had a value and now has none. `showToValue` is `false`, so the title label
 * (line 34) never renders, and there is no arrow: a lone, unlabelled checkbox or switch showing
 * only what it used to be. Filed as ledger #104.
 */
export const BooleanFieldCleared: Story = {
  name: 'Boolean: field cleared',
  render: () => <BooleanHarness {...CASES.fieldCleared} />,
}

/**
 * The exact same diff as `BooleanFieldAdded` (`from: {}`, `to: {featured: true}`), but staged
 * with `showFromValue={false}` - the flag the real panel sets when the whole document, not just
 * this field, is new (`lib/diffHarness.tsx`'s `DiffStageProps.showFromValue` doc comment: "the
 * releases document diff sets this for documents that are new in a release"). No indeterminate
 * glyph here, no arrow: just the new value and its title. The two stories are a minimal pair -
 * only the context flag changed, and it alone decides whether "never set" draws a placeholder or
 * draws nothing.
 */
export const BooleanNewDocument: Story = {
  name: 'Boolean: field set on a new document',
  render: () => <BooleanHarness {...CASES.fieldAdded} showFromValue={false} />,
}

/**
 * `publishedAt` moves from one absolute instant to another. `DatetimeFieldDiff` has no logic of
 * its own; `DatetimePreview` formats each side with `legacyDateFormat.format`, defaulting to
 * `YYYY-MM-DD HH:mm` - a calendar timestamp that reads the same the day it is written and a year
 * later, never a relative phrase.
 */
export const DatetimeChanged: Story = {
  render: () => <DatetimeHarness {...CASES.datetimeChanged} />,
}

/**
 * `readingTime` moves from 4 to 11. `NumberFieldDiff` delegates entirely to `DiffFromTo`;
 * `NumberPreview` prints the raw value with no formatting, no unit, no thousands separator.
 */
export const NumberChanged: Story = {
  render: () => <NumberHarness {...CASES.numberChanged} />,
}

/**
 * `slug.current` changes on its own, with no title change alongside it. `SlugFieldDiff` reads
 * only `diff.fields.slug`; `SlugPreview` prints `value.current`.
 */
export const SlugChanged: Story = {
  render: () => <SlugHarness {...CASES.slugChanged} />,
}

/**
 * Title and slug change together, exactly as they would when a slug is derived from its title,
 * run through the real `ChangeList` (`lib/diffHarness.tsx`'s `DiffStage`) rather than an isolated
 * `SlugFieldDiff`. The real builder produces two independent `FieldChangeNode`s and renders two
 * independent rows: nothing on screen says the slug changed BECAUSE the title did. `SlugFieldDiff`
 * itself has no way to know; it never receives the title's diff.
 */
export const SlugFollowsTitleChange: Story = {
  name: 'Slug follows title change (two rows, not one)',
  render: () => (
    <Card border radius={0} padding={4} style={{maxWidth: 560}}>
      <DiffStage
        from={{
          title: 'The Garden of Forking Paths',
          slug: {_type: 'slug', current: 'the-garden-of-forking-paths'},
        }}
        to={{
          title: 'The Garden of Forking Trails',
          slug: {_type: 'slug', current: 'the-garden-of-forking-trails'},
        }}
      />
    </Card>
  ),
}

/** All four types, changed, side by side, so they can be compared directly rather than paged
 * between. This is the everyday case for each: one clear before/after, nothing edge-case. */
export const AllFourTypes: Story = {
  name: 'All four types (comparison)',
  render: () => (
    <Stack gap={5} style={{maxWidth: 560}}>
      <Row label="Boolean (featured)" note="Both states drawn, arrow between them.">
        <BooleanHarness {...CASES.trueToFalse} />
      </Row>
      <Row label="Datetime (publishedAt)" note="Absolute timestamps, formatted by DatetimePreview.">
        <DatetimeHarness {...CASES.datetimeChanged} />
      </Row>
      <Row label="Number (readingTime)" note="Raw value, no formatting.">
        <NumberHarness {...CASES.numberChanged} />
      </Row>
      <Row label="Slug (slug.current)" note="Independent of any title change.">
        <SlugHarness {...CASES.slugChanged} />
      </Row>
    </Stack>
  ),
}

/**
 * `releaseDate` (an ordinary, inline `type: 'date'` field, no custom type name) moves from one
 * calendar date to another. The field's own `schemaType.name` really is `'date'`, so
 * `formatDateTime` skips the time format: a clean date, no meaningless `00:00`. Compare with
 * `DateViaCustomNamedType` below - the only difference between the two stories is which field
 * they read.
 */
export const DateChanged: Story = {
  name: 'Date: ordinary field (adapts correctly)',
  render: () => <DateHarness field="releaseDate" {...CASES.dateChanged} />,
}

/**
 * The same two dates, on `restrictedUntil`, typed via `customDate` - a type registered under its
 * own name, extending `date` (see the `customDateType` declaration above and finding 7 in the
 * page docblock). `resolveDiffComponent` still finds `DatetimeFieldDiff` for it, but the
 * `schemaType` the mounted component receives keeps the name `'customDate'`, so `formatDateTime`'s
 * `name === 'date'` check is false and the time format is appended to a value that has none.
 * `new Date('2026-07-20')` parses as UTC midnight: watch for a spurious `00:00`, or a time shifted
 * from it by the browser's local offset.
 */
export const DateViaCustomNamedType: Story = {
  name: 'Date: via a custom-named type (renders a spurious time)',
  render: () => <DateHarness field="restrictedUntil" {...CASES.dateCustomType} />,
}

/**
 * `editor`, a same-dataset reference, changes from one author to another. `ReferenceFieldDiff`
 * delegates to `DiffFromTo` with `ReferencePreview`, which renders the referenced document's own
 * preview - title, media - and nothing else. Compare with `CrossDatasetReferenceChanged` below.
 */
export const ReferenceChanged: Story = {
  render: () => <ReferenceHarness {...CASES.referenceChanged} />,
}

/**
 * `partnerEditor`, a `crossDatasetReference` carrying `_dataset: 'partner-publishing'` and
 * `_projectId: 'partner-org'` on the value, changes between the SAME two fixture documents as
 * `ReferenceChanged` above, through the SAME two ids. Same component (`ReferenceFieldDiff` serves
 * both types), same `ReferencePreview`. The render is pixel-identical to `ReferenceChanged`: the
 * fields that mark this as pointing outside the project are read once, to route the fetch, and
 * never reach the screen.
 */
export const CrossDatasetReferenceChanged: Story = {
  name: 'Cross-dataset reference changed (identical to same-dataset)',
  render: () => <CrossDatasetReferenceHarness {...CASES.crossDatasetReferenceChanged} />,
}

/**
 * `editor` changes from a real author to `author-mercer` - a plausible id, deliberately never
 * seeded into `authorFixtures`, standing in for a document that existed at edit time and was
 * deleted before anyone reviewed the change. No error, no id, no broken-link marker: the row
 * renders the literal word "Untitled" (`DefaultPreview.tsx`'s `preview.default.title-fallback`
 * branch), identical to how a real, existing document with an empty title field would render.
 * `value._ref` - the one fact that would tell a reviewer which document is gone - is discarded
 * three layers up the chain, at `createPreviewObserver.ts`'s `of({snapshot: undefined})` fallback.
 */
export const ReferenceToDeletedDocument: Story = {
  name: 'Reference to a deleted document (reads as "Untitled," not as missing)',
  render: () => <ReferenceHarness {...CASES.referenceToDeletedDoc} />,
}

/** The two `defaultComponents.ts` type-pairs side by side: one splits correctly on the field's
 * own schema-type name, the other never had a way to show the boundary it crosses. */
export const SharedRendererTypePairs: Story = {
  name: 'Shared-renderer type pairs (comparison)',
  render: () => (
    <Stack gap={5} style={{maxWidth: 560}}>
      <Row label="date (adapts correctly)" note="schemaType.name is 'date': time format skipped.">
        <DateHarness field="releaseDate" {...CASES.dateChanged} />
      </Row>
      <Row
        label="date via a custom-named type (does not adapt)"
        note="schemaType.name is 'customDate': time format wrongly appended."
      >
        <DateHarness field="restrictedUntil" {...CASES.dateCustomType} />
      </Row>
      <Row label="reference (same dataset)" note="ReferencePreview shows the referenced document.">
        <ReferenceHarness {...CASES.referenceChanged} />
      </Row>
      <Row
        label="crossDatasetReference (different project)"
        note="Identical render; nothing shows the dataset boundary."
      >
        <CrossDatasetReferenceHarness {...CASES.crossDatasetReferenceChanged} />
      </Row>
    </Stack>
  ),
}
