import {
  type CrossDatasetReferenceSchemaType,
  type GlobalDocumentReferenceSchemaType,
  type ObjectSchemaType,
  type ReferenceSchemaType,
} from '@sanity/types'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentProps, type ForwardedRef, forwardRef} from 'react'

import {PreviewReferenceValue as CrossDatasetPreviewReferenceValue} from '../../../../packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/PreviewReferenceValue'
import {type CrossDatasetReferenceInfo} from '../../../../packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/types'
import {type Loadable as CrossDatasetLoadable} from '../../../../packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/useReferenceInfo'
import {PreviewReferenceValue as GlobalPreviewReferenceValue} from '../../../../packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/PreviewReferenceValue'
import {type GlobalDocumentReferenceInfo} from '../../../../packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/types'
import {type Loadable as GlobalLoadable} from '../../../../packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/useReferenceInfo'
// Real components from real paths (org contract §8). This page is the companion to
// `Forms & Input/ReferenceInput`: that page is the whole field, this one is the parts
// assembled between it and its leaf renderer (`PreviewReferenceValue`, already storied),
// plus the two boundary-crossing preview parts for cross-dataset/global-document refs.
import {AutocompleteContainer} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/AutocompleteContainer'
import {CreateButton} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/CreateButton'
import {OptionPreview} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/OptionPreview'
import {ReferenceAutocomplete} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceAutocomplete'
import {ReferenceFinalizeAlertStrip} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceFinalizeAlertStrip'
import {ReferenceLinkCard} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceLinkCard'
import {ReferenceMetadataLoadErrorAlertStrip} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceMetadataLoadFailure'
import {ReferenceStrengthMismatchAlertStrip} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceStrengthMismatchAlertStrip'
import {type CreateReferenceOption} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/types'
import {type RenderPreviewCallback} from '../../../../packages/sanity/src/core/form/types/renderCallback'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {Preview} from '../../../../packages/sanity/src/core/preview/components/Preview'
import {createMockPreviewUniverse, fixtureDocuments} from '../../lib/mockDocumentPreviewStore'
import {FormStub, WithStudioProviders} from '../../lib/testProvider'

const noop = () => undefined

/* ── Shared fixture universe, same author/book schema as the companion page ────────── */

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

function Section(props: {title: string; note?: string; children: React.ReactNode}) {
  return (
    <Stack gap={2}>
      <Text size={1} weight="semibold">
        {props.title}
      </Text>
      {props.note && (
        <Text muted size={1}>
          {props.note}
        </Text>
      )}
      <Box>{props.children}</Box>
    </Stack>
  )
}

/* ── 1. The three alert-strip footers ───────────────────────────────────────────────
   `ReferenceItem` and `ReferenceInputPreview` each build the same three-condition footer
   (finalize / strength-mismatch / metadata-error) around these, see the docblock. All
   three take plain data plus a callback; no async, no context beyond i18n. */

function AlertStripGallery() {
  return (
    <Stack gap={5} style={{maxWidth: 480}}>
      <Section
        title="ReferenceFinalizeAlertStrip (weak field)"
        note="schemaType.weak === true: offered as the 'finalize' action."
      >
        <ReferenceFinalizeAlertStrip
          schemaType={{weak: true} as ReferenceSchemaType}
          handleRemoveStrengthenOnPublish={noop}
        />
      </Section>
      <Section
        title="ReferenceFinalizeAlertStrip (strong field)"
        note="schemaType.weak is falsy: same component, the 'strengthen' copy branch instead."
      >
        <ReferenceFinalizeAlertStrip
          schemaType={{weak: false} as ReferenceSchemaType}
          handleRemoveStrengthenOnPublish={noop}
        />
      </Section>
      <Section title="ReferenceStrengthMismatchAlertStrip (value is weak, schema wants strong)">
        <ReferenceStrengthMismatchAlertStrip
          actualStrength="weak"
          handleFixStrengthMismatch={noop}
        />
      </Section>
      <Section title="ReferenceStrengthMismatchAlertStrip (value is strong, schema wants weak)">
        <ReferenceStrengthMismatchAlertStrip
          actualStrength="strong"
          handleFixStrengthMismatch={noop}
        />
      </Section>
      <Section title="ReferenceMetadataLoadErrorAlertStrip">
        <ReferenceMetadataLoadErrorAlertStrip
          errorMessage="Network request failed"
          onHandleRetry={noop}
        />
      </Section>
    </Stack>
  )
}

/* ── 2. CreateButton's three branches ────────────────────────────────────────────── */

const grantedAuthor: CreateReferenceOption = {
  id: 'author',
  title: 'Author',
  type: 'author',
  template: {id: 'author'},
  permission: {granted: true, reason: ''},
}

const grantedIllustrator: CreateReferenceOption = {
  id: 'illustrator',
  title: 'Illustrator',
  type: 'illustrator',
  template: {id: 'illustrator'},
  permission: {granted: true, reason: ''},
}

const deniedAuthor: CreateReferenceOption = {
  ...grantedAuthor,
  permission: {granted: false, reason: 'insufficient permissions'},
}

function CreateButtonGallery() {
  return (
    <Stack gap={5} style={{maxWidth: 360}}>
      <Section
        title="No permission on any create option"
        note="`canCreateAny` is false: the button itself is disabled (a wrapper div is still needed, since a disabled button eats the hover that would open the tooltip)."
      >
        <CreateButton id="cb-none" createOptions={[deniedAuthor]} onCreate={noop} />
      </Section>
      <Section title="Exactly one create option: a plain button, no menu">
        <CreateButton id="cb-one" createOptions={[grantedAuthor]} onCreate={noop} />
      </Section>
      <Section
        title="More than one create option: a MenuButton"
        note="One option in the menu (illustrator) is permission-denied and stays disabled with its own tooltip, alongside the granted one."
      >
        <CreateButton
          id="cb-many"
          createOptions={[
            grantedAuthor,
            {
              ...grantedIllustrator,
              permission: {granted: false, reason: 'insufficient permissions'},
            },
          ]}
          onCreate={noop}
        />
      </Section>
    </Stack>
  )
}

/* ── 3. ReferenceLinkCard: link vs plain card ───────────────────────────────────────
   The component's own comment explains why: forwarding `as`/`forwardedAs` before a
   document type has resolved throws inside `@sanity/ui`'s styling, so the wrapper drops
   both props rather than pass them half-formed. The two states below render *visually
   identical* cards: the difference (an `<a data-as="a">` versus a bare `<div>`) only
   shows up in the DOM, never on screen, which is worth knowing before reaching for this
   component expecting a visual "is this a link" cue. */

const LinkStub = forwardRef(function LinkStub(
  props: {children?: React.ReactNode} & Record<string, unknown>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return (
    <a {...(props as object)} ref={ref}>
      {props.children}
    </a>
  )
})

function ReferenceLinkCardGallery() {
  return (
    <Stack gap={5} style={{maxWidth: 360}}>
      <Section
        title="documentId/documentType unresolved"
        note="`as` is silently dropped: renders as a plain Card, un-clickable."
      >
        <ReferenceLinkCard
          as={LinkStub}
          documentId=""
          documentType={undefined}
          tone="default"
          border
          padding={3}
        >
          <Text size={1} muted>
            Resolving…
          </Text>
        </ReferenceLinkCard>
      </Section>
      <Section
        title="documentId/documentType resolved"
        note="Same markup, now rendered `as` the link component (an <a> in the DOM, invisible here)."
      >
        <ReferenceLinkCard
          as={LinkStub}
          documentId="author-borges"
          documentType="author"
          tone="default"
          border
          padding={3}
        >
          <Text size={1}>Jorge Luis Borges</Text>
        </ReferenceLinkCard>
      </Section>
    </Stack>
  )
}

/* ── 4. ReferenceInput's own OptionPreview (not the Cross/Global one, already storied) ──
   Distinct component, distinct seam: this one takes `id`/`type` straight off a search
   hit and looks the type up in the field's own `to` list synchronously, no observable,
   no `useReferenceInfo`. Two branches: the type isn't declared, or it renders through
   `ReferencePreview` (real `prepareForPreview`, plus version/presence chrome). */

function OwnOptionPreviewGallery() {
  const schema = useSchema()
  const bookType = schema.get('book') as ObjectSchemaType
  const field = bookType.fields.find((candidate) => candidate.name === 'author')!
  const referenceType = field.type as ReferenceSchemaType

  return (
    <Stack gap={5} style={{maxWidth: 420}}>
      <Section title="Search returned a type this field does not declare in `to`">
        <Card border padding={2} radius={2}>
          <OptionPreview
            id="mystery-doc"
            type="illustrator"
            referenceType={referenceType}
            renderPreview={((p) => <Preview {...p} />) as RenderPreviewCallback}
          />
        </Card>
      </Section>
      <Section title="Resolved, declared type">
        <Card border padding={2} radius={2}>
          <OptionPreview
            id="author-borges"
            type="author"
            referenceType={referenceType}
            renderPreview={((p) => <Preview {...p} />) as RenderPreviewCallback}
          />
        </Card>
      </Section>
    </Stack>
  )
}

/* ── 5. AutocompleteContainer's width-driven layout switch ───────────────────────── */

function AutocompleteContainerGallery() {
  return (
    <Stack gap={5}>
      <Section title="Narrow host (< 480px): single column, create button stacks below">
        <div style={{width: 320, border: '1px dashed var(--card-border-color)'}}>
          <AutocompleteContainer>
            <Card padding={2} tone="primary" radius={1}>
              <Text size={1}>autocomplete</Text>
            </Card>
            <Card padding={2} tone="positive" radius={1}>
              <Text size={1}>create button</Text>
            </Card>
          </AutocompleteContainer>
        </div>
      </Section>
      <Section title="Wide host (≥ 480px): two columns, create button sits beside it">
        <div style={{width: 600, border: '1px dashed var(--card-border-color)'}}>
          <AutocompleteContainer>
            <Card padding={2} tone="primary" radius={1}>
              <Text size={1}>autocomplete</Text>
            </Card>
            <Card padding={2} tone="positive" radius={1}>
              <Text size={1}>create button</Text>
            </Card>
          </AutocompleteContainer>
        </div>
      </Section>
    </Stack>
  )
}

/* ── 6. ReferenceAutocomplete's empty popover ───────────────────────────────────────
   `ReferenceAutocomplete` (source, lines 57/88-102) branches its popover on exactly one
   thing: `hasResults = options.length > 0`. There is no third branch and no `error` prop
   on this component at all, so this same "No results for ..." render is what a genuine
   zero-hit search shows, AND what a search that errored shows, because the failure is
   normalized away one layer up before it ever reaches here (see the docblock). */

function EmptyAutocompletePopover() {
  const props = {
    id: 'internals-empty-autocomplete',
    path: ['author'],
    referenceElement: null,
    options: [],
    loading: false,
    searchString: 'zzzznotfound',
    radius: 2,
    placeholder: 'Search for an author',
    onQueryChange: noop,
    onChange: noop,
    filterOption: () => true,
    renderOption: () => null,
    renderValue: () => '',
    openButton: {onClick: noop},
    value: '',
  } as unknown as ComponentProps<typeof ReferenceAutocomplete>

  return (
    <FormStub
      documentValue={{_id: 'drafts.book-empty', _type: 'book'}}
      documentType={{name: 'book', type: 'document', fields: []} as unknown as ObjectSchemaType}
      renderPreview={((p) => <Preview {...p} />) as RenderPreviewCallback}
      focusPath={['author']}
    >
      <div style={{maxWidth: 360}}>
        <ReferenceAutocomplete {...props} />
      </div>
    </FormStub>
  )
}

/* ── 7. The cross-dataset / global-document boundary ────────────────────────────────
   Both `PreviewReferenceValue`s receive the identifiers that name the boundary being
   crossed (`dataset`+`projectId`, or `resourceType`+`resourceId`) and forward them to
   their `*ReferencePreview`. Neither preview renders them as text anywhere: they are
   read exactly once each, inside a `useMemo` that only fires when a referenced document
   has an image to build a URL for (CrossDatasetReferencePreview.tsx:66-69,
   GlobalDocumentReferencePreview.tsx:70). Two resolved references below, reaching into
   two different projects, rendering identically apart from the title/subtitle text. */

const crossType = {
  name: 'authorRef',
  type: 'crossDatasetReference',
  dataset: 'marketing-content',
  to: [{type: 'author', preview: {select: {title: 'name'}}}],
} as unknown as CrossDatasetReferenceSchemaType

const globalType = {
  name: 'authorRef',
  type: 'globalDocumentReference',
  resourceType: 'dataset',
  resourceId: 'other-project.production',
  to: [{type: 'author', preview: {select: {title: 'name'}}}],
} as unknown as GlobalDocumentReferenceSchemaType

const crossInfo: CrossDatasetLoadable<CrossDatasetReferenceInfo> = {
  isLoading: false,
  error: undefined,
  retry: noop,
  result: {
    id: 'author-borges',
    type: 'author',
    availability: {available: true, reason: 'READABLE'},
    preview: {published: {title: 'Jorge Luis Borges', subtitle: 'Modern'}},
  },
}

const globalInfo: GlobalLoadable<GlobalDocumentReferenceInfo> = {
  isLoading: false,
  error: undefined,
  retry: noop,
  result: {
    id: 'author-borges',
    type: 'author',
    availability: {available: true, reason: 'READABLE'},
    preview: {published: {title: 'Jorge Luis Borges', subtitle: 'Modern'}},
  },
}

function CrossBoundaryGallery() {
  return (
    <Flex gap={3} wrap="wrap">
      <Card border padding={2} radius={2} style={{maxWidth: 320}}>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            CrossDatasetReferenceInput/PreviewReferenceValue, dataset: {crossType.dataset}, project:
            eu-project-1 (passed but never shown)
          </Text>
          <CrossDatasetPreviewReferenceValue
            value={{
              _type: 'crossDatasetReference',
              _ref: 'author-borges',
              _dataset: crossType.dataset,
              _projectId: 'eu-project-1',
            }}
            type={crossType}
            referenceInfo={crossInfo}
          />
        </Stack>
      </Card>
      <Card border padding={2} radius={2} style={{maxWidth: 320}}>
        <Stack gap={2}>
          <Text muted size={0} weight="medium">
            GlobalDocumentReferenceInput/PreviewReferenceValue, resource: {globalType.resourceId}{' '}
            (passed but never shown)
          </Text>
          <GlobalPreviewReferenceValue
            value={{
              _type: 'globalDocumentReference',
              _ref: 'dataset:other-project.production:author-borges',
            }}
            type={globalType}
            referenceInfo={globalInfo}
          />
        </Stack>
      </Card>
    </Flex>
  )
}

const meta: Meta = {
  title: 'Forms & Input/Reference Input Internals',
  parameters: {
    // No meta-level `component`: each story drives state through gallery fixtures rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'The same three-condition footer is built by hand in two different files, and the ' +
            'search popover has no way to tell a genuine failure from an honest zero-match ' +
            'search: both collapse to the same state before they ever reach the component that ' +
            'renders them.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/ReferenceInput/*`, plus the boundary-crossing preview halves of `CrossDatasetReferenceInput/` and `GlobalDocumentReferenceInput/` |',
          '| Tier | SERVICE. None of these render on their own; they are the load-bearing glue `ReferenceInput`, `CrossDatasetReferenceInput` and `GlobalDocumentReferenceInput` assemble into the CORE field on the companion page |',
          '| Audit | 🟡 needs-work (`reference-integrity`, `error-recovery`), see the findings below |',
          '| Patterns | `reference-integrity` · `error-recovery` |',
          '| Directory count | 19 non-test files in `ReferenceInput/`: 4 types/hooks, 2 already storied elsewhere, leaving 13 component files; this page stories 8 directly plus a ninth as a dependency |',
          '',
          '`Forms & Input/ReferenceInput` is the whole field. This page is a companion: the ' +
            'smaller parts in between it and the leaf renderer (`PreviewReferenceValue`, already ' +
            'its own page), the alert-strip footers, the create button, the link-card wrapper, ' +
            "the field's own `OptionPreview`, the width-driven autocomplete layout, and the two " +
            'parts that actually reach across a dataset or project boundary.',
          '',
          'This page stories 8 of the 13 component files directly (`AutocompleteContainer`, ' +
            '`CreateButton`, `OptionPreview`, `ReferenceAutocomplete`, `ReferenceLinkCard`, the ' +
            'three alert strips) and exercises a ninth as a direct dependency of one of those ' +
            'stories (`ReferencePreview`, under `OptionPreview`). `ReferenceField` is skipped: it ' +
            'is a generic `FormField` title/description/actions wrapper with no reference-specific ' +
            'branch worth a dedicated page. `ReferenceItemRefProvider` is skipped: it forwards ' +
            'three refs through context and renders only `props.children`, with no visual ' +
            'footprint of its own. `ReferenceItem` and `ReferenceInputPreview` are **not storied ' +
            'here**; the findings below explain why, and what reading them turned up instead.',
          '',
          '<details><summary><b>The same footer is built three times.</b></summary>',
          '',
          '`ReferenceItem.tsx` (lines 216-237) and `ReferenceInputPreview.tsx` (lines 132-153) ' +
            'each construct an identical three-condition footer (finalize-alert, ' +
            'strength-mismatch-alert, metadata-error-alert, same order, same components), and ' +
            '`ReferenceInput.tsx` folds the metadata-error case into its own inline `Alert` for ' +
            'the fourth, weak-reference-to-nonexistent-document case. None of the three shares ' +
            'the assembly. A fix to one condition is a fix to three call sites, the same shape as ' +
            'the already-ledgered `OptionPreview` duplication between the cross-dataset and ' +
            'global-document inputs.',
          '',
          '</details>',
          '',
          '<details><summary><b>No third branch exists in the search popover.</b></summary>',
          '',
          '`ReferenceAutocomplete` (source, around line 57 and 88-102) computes exactly one ' +
            'boolean, `hasResults = options.length > 0`, and renders either the results or a "No ' +
            'results for ..." message. There is no `error` prop anywhere on this component. ' +
            "`ReferenceInput.tsx`'s `handleQueryChange` (its `catchError`) already collapses a " +
            'failed search into `{hits: [], searchString, isLoading: false}`, the identical shape ' +
            'a legitimate zero-match search produces, before it ever reaches this component, ' +
            'firing a toast on the way past. So a genuine search failure and an honest "nothing ' +
            'matched" are the same field state, distinguishable only by a toast that has usually ' +
            'already disappeared by the time anyone looks back at the field. ' +
            '`CrossDatasetReferenceInput.tsx` does the same collapse but titles its toast with a ' +
            "bare English string, `'Reference search failed'`, never passed through `t()`, " +
            "inconsistent with `ReferenceInput.tsx`'s translated title for the identical " +
            'situation.',
          '',
          '</details>',
          '',
          '<details><summary><b>The boundary is crossed silently.</b></summary>',
          '',
          '`CrossDatasetReferenceInput/PreviewReferenceValue.tsx` and ' +
            '`GlobalDocumentReferenceInput/PreviewReferenceValue.tsx` both receive the identifiers ' +
            'that name what is being reached into (`dataset`/`projectId` for one, ' +
            '`resourceType`/`resourceId` for the other) and forward them straight to their ' +
            '`*ReferencePreview`. Neither preview ever renders those identifiers as visible text: ' +
            'each reads them exactly once, inside a `useMemo` that only fires to build an image ' +
            'URL when the referenced document happens to have media ' +
            '(`CrossDatasetReferencePreview.tsx:66-69`, `GlobalDocumentReferencePreview.tsx:70`). ' +
            'Two references into two entirely different projects render pixel-identically apart ' +
            'from their title and subtitle, matching what ledger 119 found in the diff view, now ' +
            'confirmed at the field-level preview itself, in both variants.',
          '',
          '</details>',
          '',
          '<details><summary><b>Does anything here proceed without waiting on a check it depends on?</b></summary>',
          '',
          'One instance exists in this subsystem, but it lives one level up and is already the ' +
            "audit finding on the companion page: `ReferenceInput.tsx`'s `handleCreateNew` (lines " +
            '76-131) patches the parent document and calls `onEditReference` synchronously, ' +
            'before any input, the "mint-and-bind" defect the companion page\'s Current/Recommended ' +
            'pair demonstrates. Nothing on *this* page (the alert strips, `CreateButton` itself, ' +
            '`ReferenceLinkCard`, `AutocompleteContainer`, `ReferenceAutocomplete`) introduces a ' +
            'further instance; each is a plain renderer or a synchronous, fully-gated computation.',
          '',
          '</details>',
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
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** The three alert-strip footers `ReferenceItem`/`ReferenceInputPreview` each assemble by hand. */
export const AlertStrips: Story = {
  render: () => <AlertStripGallery />,
}

/** `CreateButton`'s three branches: no permission, one option, several options. */
export const CreateButtonStates: Story = {
  render: () => <CreateButtonGallery />,
}

/**
 * The wrapper every reference preview mounts inside. Visually identical whether the
 * document/type behind it has resolved or not; the difference is DOM-only.
 */
export const ReferenceLinkCardResolution: Story = {
  render: () => <ReferenceLinkCardGallery />,
}

/** `ReferenceInput`'s own `OptionPreview`, distinct from the Cross/Global one already storied. */
export const OwnOptionPreview: Story = {
  render: () => <OwnOptionPreviewGallery />,
}

/** The width breakpoint that decides whether the create button sits beside or below the search box. */
export const AutocompleteContainerLayout: Story = {
  render: () => <AutocompleteContainerGallery />,
}

/** The one popover branch a failed search and an empty search both reach. See the finding above. */
export const EmptySearchPopover: Story = {
  render: () => <EmptyAutocompletePopover />,
}

/** Two references, two different projects, the same silence about which project either is. */
export const CrossBoundaryPreview: Story = {
  render: () => <CrossBoundaryGallery />,
}
