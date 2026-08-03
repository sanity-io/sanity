import {type ObjectSchemaType, type Reference, type ReferenceSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real components from real paths (org contract §8). This page mounts the sub-component
// directly rather than driving it through ReferenceInput, because the whole point is to put
// its six returns beside each other, and the input can only ever be in one of them at a time.
import {PreviewReferenceValue} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/PreviewReferenceValue'
import {type ReferenceInfo} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/types'
import {type Loadable} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/useReferenceInfo'
import {type RenderPreviewCallback} from '../../../../packages/sanity/src/core/form/types/renderCallback'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {Preview} from '../../../../packages/sanity/src/core/preview/components/Preview'
import {createMockPreviewUniverse, fixtureDocuments} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

const universe = createMockPreviewUniverse({documents: fixtureDocuments})

const schemaTypes = [
  {
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
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'author', title: 'Author', type: 'reference', to: [{type: 'author'}]},
    ],
  },
]

const renderPreview: RenderPreviewCallback = (previewProps) => <Preview {...previewProps} />

const noop = () => undefined

/* ── The six inputs ────────────────────────────────────────────────────────
   Every one of these is a `Loadable<ReferenceInfo>` shaped to land on exactly one of the
   component's six return statements. They are the component's own prop, not a fabricated data
   source, which is why this is a Studio-lane page and not a Stubbed one: the fixture here is
   the input, and the behaviour under test is what the component does with it. */

const loading: Loadable<ReferenceInfo> = {
  isLoading: true,
  result: undefined,
  error: undefined,
  retry: noop,
}

const errored: Loadable<ReferenceInfo> = {
  isLoading: false,
  result: undefined,
  error: new Error('Network request failed'),
  retry: noop,
}

/** A resolved, readable, published author. The only one of the six that is not a failure. */
const resolved: Loadable<ReferenceInfo> = {
  isLoading: false,
  error: undefined,
  retry: noop,
  result: {
    id: 'author-borges',
    type: 'author',
    isPublished: true,
    availability: {available: true, reason: 'READABLE'},
    preview: {
      snapshot: {_id: 'author-borges', _type: 'author', name: 'Jorge Luis Borges', era: 'Modern'},
      original: null,
      isLoading: false,
    },
  },
}

const withReason = (reason: 'NOT_FOUND' | 'PERMISSION_DENIED'): Loadable<ReferenceInfo> => ({
  isLoading: false,
  error: undefined,
  retry: noop,
  result: {
    id: 'author-borges',
    type: reason === 'NOT_FOUND' ? undefined : 'author',
    isPublished: null,
    availability: {available: false, reason},
    preview: {snapshot: null, original: null, isLoading: false},
  },
})

/** Resolves to a type the schema does not declare, which reaches the second InvalidType return. */
const undeclaredType: Loadable<ReferenceInfo> = {
  isLoading: false,
  error: undefined,
  retry: noop,
  result: {
    id: 'author-borges',
    type: 'illustrator',
    isPublished: true,
    availability: {available: true, reason: 'READABLE'},
    preview: {
      snapshot: {_id: 'author-borges', _type: 'illustrator'},
      original: null,
      isLoading: false,
    },
  },
}

const plainValue: Reference = {_type: 'reference', _ref: 'author-borges'}

/** A reference created in place: the target does not exist yet and that is correct. */
const createdInPlace: Reference = {
  _type: 'reference',
  _ref: 'author-new-0001',
  _weak: true,
  _strengthenOnPublish: {type: 'author'},
}

/** Same, but naming a type the schema never declared. Reaches the FIRST InvalidType return. */
const createdInPlaceBadType: Reference = {
  _type: 'reference',
  _ref: 'author-new-0002',
  _weak: true,
  _strengthenOnPublish: {type: 'illustrator'},
}

function Harness(props: {
  referenceInfo: Loadable<ReferenceInfo>
  value: Reference
  showTypeLabel?: boolean
}) {
  const schema = useSchema()
  const bookType = schema.get('book') as ObjectSchemaType
  const field = bookType.fields.find((candidate) => candidate.name === 'author')!
  const schemaType = field.type as ReferenceSchemaType

  return (
    <Card border padding={2} radius={0} style={{maxWidth: 460}}>
      <PreviewReferenceValue
        referenceInfo={props.referenceInfo}
        renderPreview={renderPreview}
        type={schemaType}
        value={props.value}
        showTypeLabel={props.showTypeLabel}
      />
    </Card>
  )
}

/** All six returns at once. The reason this page exists. */
function AllSix() {
  const rows: {label: string; info: Loadable<ReferenceInfo>; value: Reference}[] = [
    {label: '1 · Loading', info: loading, value: plainValue},
    {label: '1 · Errored (same return as loading)', info: errored, value: plainValue},
    {
      label: '2 · Created in place, type not declared',
      info: withReason('NOT_FOUND'),
      value: createdInPlaceBadType,
    },
    {
      label: '3 · Created in place, resolvable',
      info: withReason('NOT_FOUND'),
      value: createdInPlace,
    },
    {label: '4 · Not found', info: withReason('NOT_FOUND'), value: plainValue},
    {
      label: '4 · Permission denied (same return)',
      info: withReason('PERMISSION_DENIED'),
      value: plainValue,
    },
    {label: '5 · Resolved type not declared', info: undeclaredType, value: plainValue},
    {label: '6 · Resolved', info: resolved, value: plainValue},
  ]

  return (
    <Stack gap={4} style={{maxWidth: 520}}>
      {rows.map((row) => (
        <Stack key={row.label} gap={2}>
          <Text muted size={0} weight="medium">
            {row.label}
          </Text>
          <Harness referenceInfo={row.info} value={row.value} />
        </Stack>
      ))}
    </Stack>
  )
}

const meta: Meta = {
  title: 'Forms & Input/PreviewReferenceValue',
  parameters: {
    // No meta-level `component`: each story drives state through Loadable input rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'What a person actually sees in every reference field has six possible shapes, and five ' +
            'of them are failures, two of which render identically and differ only in a tooltip a ' +
            'reader has to think to hover.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/ReferenceInput/PreviewReferenceValue.tsx` |',
          '| Tier | CORE. It is what a person actually sees in every reference field, and five of its six outcomes are failures |',
          '| Audit | 🟡 needs-work (`reference-integrity`, `error-recovery`). Two of the six outcomes are indistinguishable on screen, and the one piece of information that separates them is only reachable on hover |',
          '| Patterns | `reference-integrity` · `error-recovery` |',
          '| Returns | 6 statements, 5 distinct appearances (two paths both render `InvalidType`) |',
          '',
          'The renderer inside every reference field. `ReferenceInput` decides what a reference ' +
            'means; this decides what you look at once it has. This page mounts the component ' +
            '**directly**, one story per return statement, because the whole argument is what the ' +
            'six look like beside each other and the input can only ever be in one of them at a ' +
            "time. `referenceInfo` is the component's own prop, so the fixtures here are inputs " +
            'rather than a fabricated data source: this is a Studio-lane page, not a Stubbed one.',
          '',
          '**What reading it turned up.** The component has six `return` statements and produces ' +
            '**five distinct appearances**, because two different code paths both render ' +
            '`InvalidType`. A state count is a ceiling on how many pictures a component can show, ' +
            'never a count of how many it does.',
          '',
          '> **Why it matters:** the `NOT_FOUND` and `PERMISSION_DENIED` branches share one return ' +
            'and render **identically**: the same muted "Document unavailable" text and the same ' +
            'help icon. Only the tooltip tells them apart, and the difference decides whether a ' +
            'person should go fix their own content or go ask an administrator. It is not a bug ' +
            'and no test would catch it. It is visible only when the states are put next to each ' +
            'other, which is what this page does.',
          '',
          'Fixture universe is the shared author/book one from `lib/mockDocumentPreviewStore.ts`, ' +
            'so the resolved story runs the real `prepareForPreview` pipeline rather than a ' +
            'hand-drawn card.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      previewStore: universe.store,
    }),
  ],
  tags: [
    'autodocs',
    'chapter:forms',
    'pattern:reference-integrity',
    'pattern:error-recovery',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/**
 * Every return the component can take, stacked. Read down the list and note how far you get
 * before reaching a case where anything actually worked.
 */
export const ReturnMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 780px tall, so
  // 240px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '804px'}}},
  render: () => <AllSix />,
}

/**
 * `isLoading` is true. A placeholder preview at the real content height, so nothing jumps when
 * the data lands.
 */
export const Loading: Story = {
  render: () => <Harness referenceInfo={loading} value={plainValue} />,
}

/**
 * `error` is set. Identical to Loading, because the component's first branch is
 * `isLoading || error`. A permanent failure and a slow network are the same picture, and the
 * `retry` callback that would distinguish them is never offered to the person looking at it.
 */
export const Errored: Story = {
  render: () => <Harness referenceInfo={errored} value={plainValue} />,
}

/**
 * A reference created in place whose `_strengthenOnPublish.type` is not in the field's `to`
 * list. A schema error, surfaced inside a field, to an author who cannot fix schemas.
 *
 * Note the `referenceInfo` this needs: `NOT_FOUND`, not loading. The create-in-place branch sits
 * *below* the `isLoading || error` guard, so a loading state never reaches it. The first draft of
 * this story passed `loading` here and rendered the placeholder while claiming to show an invalid
 * type. It compiled, it rendered, and it was wrong. The render check caught it because the markup
 * was byte-identical to the Loading story.
 */
export const CreatedInPlaceUndeclaredType: Story = {
  render: () => <Harness referenceInfo={withReason('NOT_FOUND')} value={createdInPlaceBadType} />,
}

/**
 * The valid create-in-place case: the referenced document does not exist yet and that is
 * correct. The preview is drawn from a stub, so it shows the *type's* preview rather than the
 * document's, which is why it looks emptier than a resolved reference.
 */
export const CreatedInPlace: Story = {
  render: () => (
    <Harness referenceInfo={withReason('NOT_FOUND')} value={createdInPlace} showTypeLabel />
  ),
}

/**
 * `availability.reason === 'NOT_FOUND'`. The referenced document is not there.
 *
 * Compare with `PermissionDenied` below: they are the same return statement and the same
 * picture. Hover the help icon to reach the only difference.
 */
export const NotFound: Story = {
  render: () => <Harness referenceInfo={withReason('NOT_FOUND')} value={plainValue} />,
}

/**
 * `availability.reason === 'PERMISSION_DENIED'`. The document exists and this person may not
 * read it, which is a completely different situation with a completely different remedy, and
 * renders as the same eleven pixels of muted text.
 */
export const PermissionDenied: Story = {
  render: () => <Harness referenceInfo={withReason('PERMISSION_DENIED')} value={plainValue} />,
}

/**
 * The document resolved, is readable, and its `_type` is not one the field declares. The second
 * of the two returns that render `InvalidType`.
 */
export const ResolvedUndeclaredType: Story = {
  render: () => <Harness referenceInfo={undeclaredType} value={plainValue} />,
}

/**
 * The one everybody has seen. It is the last return in the file, which is a fair picture of how
 * much has to go right to reach it.
 */
export const Resolved: Story = {
  render: () => <Harness referenceInfo={resolved} value={plainValue} showTypeLabel />,
}
