import {
  type ObjectSchemaType,
  type Path,
  type Reference,
  type ReferenceSchemaType,
  type SanityDocument,
} from '@sanity/types'
import {Button as UIButton, Card, Code, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useId,
  useRef,
  useState,
} from 'react'
import {of} from 'rxjs'
import {delay} from 'rxjs/operators'

// Real components from real paths (org contract §8): the input under audit, the
// Preview pipeline it renders through, and the patch/type layer it emits.
import {ReferenceInput} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceInput'
import {
  type CreateReferenceOption,
  type EditReferenceEvent,
  type ReferenceInputProps,
  type ReferenceSearchHit,
} from '../../../../packages/sanity/src/core/form/inputs/ReferenceInput/types'
import {type PatchEvent} from '../../../../packages/sanity/src/core/form/patch/PatchEvent'
import {type FormPatch} from '../../../../packages/sanity/src/core/form/patch/types'
import {
  type EditReferenceOptions,
  ReferenceInputOptionsProvider,
} from '../../../../packages/sanity/src/core/form/studio/contexts/ReferenceInputOptions'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {Preview} from '../../../../packages/sanity/src/core/preview/components/Preview'
import {type TemplatePermissionsResult} from '../../../../packages/sanity/src/core/store/grants/templatePermissions'
import {getDraftId, getPublishedId} from '../../../../packages/sanity/src/core/util/draftUtils'
import {FormBuilderHarness} from '../../lib/formBuilderHarness'
import {createMockPreviewUniverse, fixtureDocuments} from '../../lib/mockDocumentPreviewStore'
import {FormStub, WithStudioProviders} from '../../lib/testProvider'

/**
 * One shared fixture universe for every story in this file. Created-in-place ids are
 * unique per mint, so mutations from the create-flow stories cannot collide with the
 * static fixtures other stories read.
 */
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
      {
        name: 'weakAuthor',
        title: 'Author (weak)',
        type: 'reference',
        weak: true,
        to: [{type: 'author'}],
      },
    ],
  },
]

const hostDocument = fixtureDocuments.find((doc) => doc._id === 'drafts.book-anna-karenina')!

/** Search hits derived from the fixture universe, one per draft/published pair. */
const searchableAuthors = (() => {
  const byPublishedId = new Map<string, {name: string; published: boolean}>()
  for (const doc of fixtureDocuments) {
    if (doc._type !== 'author') continue
    const publishedId = getPublishedId(doc._id)
    const existing = byPublishedId.get(publishedId)
    byPublishedId.set(publishedId, {
      // Prefer the published title; fall back to the draft's.
      name:
        doc._id === publishedId ? (doc.name as string) : (existing?.name ?? (doc.name as string)),
      published: existing?.published || doc._id === publishedId,
    })
  }
  return [...byPublishedId.entries()].map(([id, entry]) => ({id, ...entry}))
})()

function toHit(author: (typeof searchableAuthors)[number]): ReferenceSearchHit {
  return {id: author.id, type: 'author', published: author.published}
}

/** Honest search: filters fixtures by the query; a no-match query returns []. */
const searchRelevant: ReferenceInputProps['onSearch'] = (query) =>
  of(
    searchableAuthors
      .filter((author) => author.name.toLowerCase().includes(query.toLowerCase()))
      .map(toHit),
  ).pipe(delay(400))

/**
 * The audit defect: every query — including nonsense — returns the full author list,
 * so a no-match query surfaces unrelated documents instead of "No results".
 */
const searchUnrelated: ReferenceInputProps['onSearch'] = () =>
  of(searchableAuthors.map(toHit)).pipe(delay(400))

const createAuthorOption: CreateReferenceOption = {
  id: 'author',
  title: 'Author',
  type: 'author',
  template: {id: 'author'},
  permission: {granted: true, reason: ''},
}

/**
 * Stand-in for Studio's router-bound `ReferenceChildLink`. Re-verified for this build:
 * without an `EditReferenceLinkComponent` in `ReferenceInputOptions` context, the
 * resolved-value preview card renders `null` silently (the card's `as` component
 * resolves to a null-returning wrapper) — so every story showing a value provides one.
 */
const EditReferenceLinkStub = forwardRef(function EditReferenceLinkStub(
  props: {
    children?: ReactNode
    documentId?: string
    documentType?: string
    parentRefPath?: Path
    template?: unknown
  } & Record<string, unknown>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  const {
    children,
    documentId,
    documentType,
    parentRefPath: _parentRefPath,
    template: _template,
    ...rest
  } = props
  return (
    <a
      {...(rest as object)}
      ref={ref}
      data-document-id={documentId}
      data-document-type={documentType}
    >
      {children}
    </a>
  )
})

function renderPreview(previewProps: Parameters<ReferenceInputProps['renderPreview']>[0]) {
  return <Preview {...previewProps} />
}

/** Apply the input's emitted patches to the local reference value (set/setIfMissing/unset). */
function applyReferencePatches(
  prev: Reference | undefined,
  change: FormPatch | FormPatch[] | PatchEvent,
): Reference | undefined {
  const patches: FormPatch[] = Array.isArray(change)
    ? change
    : 'patches' in change
      ? (change.patches as FormPatch[])
      : [change]
  let next: Record<string, unknown> | undefined = prev ? {...prev} : undefined
  for (const patch of patches) {
    const key = patch.path[0]
    if (patch.type === 'setIfMissing') {
      if (typeof key === 'string') {
        next = next ?? {}
        next[key] = next[key] ?? patch.value
      } else if (next === undefined) {
        next = {...(patch.value as Record<string, unknown>)}
      }
    } else if (patch.type === 'set') {
      if (typeof key === 'string') {
        next = next ?? {}
        next[key] = patch.value
      } else {
        next = {...(patch.value as Record<string, unknown>)}
      }
    } else if (patch.type === 'unset') {
      if (typeof key === 'string') {
        if (next) delete next[key]
      } else {
        next = undefined
      }
    }
  }
  return next as Reference | undefined
}

function ValuePanel(props: {value: Reference | undefined; label?: string}) {
  return (
    <Card border padding={3} radius={2} tone="transparent">
      <Stack gap={3}>
        <Text size={0} weight="medium" muted>
          {props.label ?? 'Field value (what the document now contains)'}
        </Text>
        <Code size={0} language="json">
          {props.value ? JSON.stringify(props.value, null, 2) : 'undefined, no reference bound'}
        </Code>
      </Stack>
    </Card>
  )
}

function Note(props: {tone?: 'caution' | 'critical' | 'positive'; children: ReactNode}) {
  return (
    <Card border padding={3} radius={2} tone={props.tone ?? 'caution'}>
      <Text size={1}>{props.children}</Text>
    </Card>
  )
}

interface DemoProps {
  fieldName?: 'author' | 'weakAuthor'
  value?: Reference
  /** Controlled mode: the parent owns the value and receives patch results. */
  onValueChange?: (value: Reference | undefined) => void
  /** Focus path relative to the input (`['_ref']` = editing mode). */
  focusPath?: Path
  /** Absolute focus path for the form stub — set to the field path to autofocus. */
  formFocusPath?: Path
  readOnly?: boolean
  onSearch?: ReferenceInputProps['onSearch']
  createOptions?: CreateReferenceOption[]
  onEditReference?: (event: EditReferenceEvent) => void
  showValuePanel?: boolean
}

/**
 * Mounts the real `ReferenceInput` inside the studio provider + form stubs, wiring the
 * knobs a story needs. The prop object is completed with `as unknown as` for the long
 * tail of `ObjectInputProps` members the component never reads (mirroring how the
 * component's own test harness casts) — everything it does read is passed for real.
 */
function ReferenceFieldDemo(props: DemoProps) {
  const {
    fieldName = 'author',
    onValueChange,
    onSearch = searchRelevant,
    createOptions = [],
    onEditReference,
    showValuePanel = false,
  } = props

  const schema = useSchema()
  const bookType = schema.get('book') as ObjectSchemaType
  const field = bookType.fields.find((candidate) => candidate.name === fieldName)!
  const schemaType = field.type as ReferenceSchemaType

  const [innerValue, setInnerValue] = useState(props.value)
  const value = onValueChange ? props.value : innerValue
  const setValue = onValueChange ?? setInnerValue

  const [focusPath, setFocusPath] = useState<Path>(props.focusPath ?? [])
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Unique per mounted instance. The real FormBuilder derives a unique input id per field from
  // the member path; this bare harness must do the same, or the autodocs page (which renders
  // every story at once, most with the default `author` field) would emit many inputs sharing
  // `id="storybook-author"` — duplicate DOM ids that break `label[for]` and `getElementById`.
  const uid = `storybook-${fieldName}-${useId().replace(/:/g, '')}`

  const handleChange = useCallback(
    (change: FormPatch | FormPatch[] | PatchEvent) => {
      setValue(applyReferencePatches(value, change))
    },
    [setValue, value],
  )

  const handlePathFocus = useCallback(
    (path: Path) => {
      // The input reports both absolute (`['author']`) and relative (`['_ref']`) paths;
      // its own `focusPath` prop is relative, so strip the field segment.
      setFocusPath(path[0] === fieldName ? path.slice(1) : path)
    },
    [fieldName],
  )

  const inputProps = {
    schemaType,
    value,
    path: [fieldName],
    focusPath,
    focused: false,
    id: uid,
    level: 0,
    liveEdit: false,
    changed: false,
    readOnly: props.readOnly,
    validation: [],
    presence: [],
    elementProps: {
      id: uid,
      onBlur: () => undefined,
      onFocus: () => undefined,
      ref: inputRef,
    },
    onChange: handleChange,
    onPathFocus: handlePathFocus,
    onSearch,
    createOptions,
    onEditReference: onEditReference ?? (() => undefined),
    renderPreview,
    // Dead prop, re-verified this build: the component resolves its link component from
    // `ReferenceInputOptions` context, never from this prop — passed only to satisfy the type.
    editReferenceLinkComponent: EditReferenceLinkStub,
  } as unknown as ReferenceInputProps

  return (
    <FormStub
      documentValue={hostDocument}
      documentType={bookType}
      renderPreview={renderPreview}
      focusPath={props.formFocusPath ?? []}
      referenceInputOptions={{EditReferenceLinkComponent: EditReferenceLinkStub as never}}
    >
      <Stack gap={3} style={{maxWidth: 520}}>
        <ReferenceInput {...inputProps} />
        {showValuePanel && <ValuePanel value={value} />}
      </Stack>
    </FormStub>
  )
}

const meta: Meta = {
  title: 'Forms & Input/ReferenceInput',
  parameters: {
    // No meta-level `component`: each story drives state through harness props rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Pressing "Create new" mints and binds a draft to the parent document before the ' +
            'editor types anything, so cancelling leaves a dangling reference plus an orphan ' +
            'draft. It is the single most-cited defect across the 8-product benchmark, and every ' +
            'Current-versus-Recommended pair on this page circles it.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/ReferenceInput/ReferenceInput.tsx`, Studio-only (no design-system equivalent) |',
          '| Tier | CORE. The schema-driven reference field is load-bearing content-model machinery: it is how relational integrity is authored, and no design system ships an equivalent |',
          '| Audit | 🔴 needs-work (`reference-integrity`, `autocompletion`, `safe-exploration`). "Create…" mints **and binds** a draft before any user input, so cancelling leaves a dangling reference plus an orphan draft (the single most-cited defect of the 8-product benchmark); and a no-match search query returns *unrelated* authors instead of an honest "No results" |',
          '| Patterns | `reference-integrity` · `autocompletion` · `safe-exploration` |',
          '',
          'The field that links one document to another, pick an existing author for a book, or ' +
            'spin up a new one inline, and the machinery that keeps those links honest.',
          '',
          'The stories mount the **real** `ReferenceInput` on the full studio provider stack ' +
            '(`lib/testProvider.tsx`) with a fixture-backed `DocumentPreviewStore` ' +
            '(`lib/mockDocumentPreviewStore.ts`): availability, `_type` resolution, publish-status ' +
            'probing and the `prepareForPreview` pipeline all execute for real against an ' +
            'author/book fixture universe. Search is a story-supplied observable, which is ' +
            'exactly the seam the `autocompletion` defect lives in.',
          '',
          'Harness notes: most stories mount the input bare (no `FormBuilder`), so document-level ' +
            'chrome (change bars, presence avatars) is out of scope there, and the original ' +
            'create-flow pair narrates the child pane. The **"rendered" create-flow pair** instead ' +
            'runs the input inside a live `FormBuilder` (`lib/formBuilderHarness.tsx`) with a ' +
            'second live author form as the child pane, so the mint-and-bind sequence and its ' +
            'dangling-ref consequence render for real. The mock store has no live listener, so ' +
            'mutation stories remount to re-read.',
          '',
          'Re-verified findings from the previous build (all still current on this branch): ' +
            '`getReferenceInfo` and `editReferenceLinkComponent` exist on `ReferenceInputProps` ' +
            'but are dead, the component resolves both via hooks/context ' +
            '(`useDocumentPreviewStore`, `ReferenceInputOptions`); without ' +
            '`ReferenceInputOptionsProvider` supplying `EditReferenceLinkComponent` the ' +
            'resolved-value preview card silently renders null; the router must be ' +
            '`route.intents(…)` or the "Open in new tab" link throws; `onPathFocus` is required ' +
            'with no default, the input crashes on focus without it.',
          '',
          '> **Why it matters:** pressing "Create new" mints **and binds** a draft to the parent ' +
            'document before the editor types anything, so cancelling leaves a dangling reference ' +
            'plus an orphan draft. It is the single most-cited defect across the 8-product ' +
            'benchmark, and every "Current vs Recommended" pair on this page circles it.',
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
    'chapter:cms',
    'chapter:forms',
    'chapter:people',
    'pattern:reference-integrity',
    'pattern:autocompletion',
    'pattern:safe-exploration',
    'audit:needs-work',
    'source:studio-only',
    'tier:core',
  ],
}

export default meta
type Story = StoryObj

/** No value, not focused: the empty autocomplete with its i18n'd placeholder. */
export const Empty: Story = {
  render: () => <ReferenceFieldDemo />,
}

/**
 * Autofocused type-ahead against the fixture authors (400 ms simulated latency, so the
 * loading state is visible). Try "leo": note Stanisław Lem is draft-only, so selecting
 * him binds weakly with `_strengthenOnPublish` until publish.
 */
export const Searching: Story = {
  render: () => (
    <ReferenceFieldDemo focusPath={['_ref']} formFocusPath={['author']} showValuePanel />
  ),
}

/**
 * A bound strong reference to a published document with a draft: the preview card
 * resolves title/subtitle through the real `prepareForPreview` pipeline and shows the
 * draft+published status dots. The context menu's "Open in new tab" renders an
 * `IntentLink`; this is the story that breaks if the harness router lacks intents.
 */
export const ResolvedValue: Story = {
  name: 'Resolved value',
  render: () => (
    <ReferenceFieldDemo value={{_type: 'reference', _ref: 'author-tolstoy'}} showValuePanel />
  ),
}

/** A weak reference (`weak: true` in schema): same card, `_weak: true` in the value. */
export const WeakReference: Story = {
  name: 'Weak reference',
  render: () => (
    <ReferenceFieldDemo
      fieldName="weakAuthor"
      value={{_type: 'reference', _ref: 'author-austen', _weak: true}}
      showValuePanel
    />
  ),
}

/**
 * Value strength contradicts the schema (weak value on a strong field): the input
 * surfaces the mismatch as a footer alert strip with a one-click fix.
 */
export const StrengthMismatch: Story = {
  name: 'Strength mismatch',
  render: () => (
    <ReferenceFieldDemo value={{_type: 'reference', _ref: 'author-austen', _weak: true}} />
  ),
}

/**
 * A weak reference whose target does not exist (`author-missing` is absent from the
 * fixture universe): the editing view shows the nonexistent-document alert with the
 * offending id and a clear action.
 */
export const MissingTarget: Story = {
  name: 'Missing target',
  render: () => (
    <ReferenceFieldDemo
      fieldName="weakAuthor"
      value={{_type: 'reference', _ref: 'author-missing', _weak: true}}
      focusPath={['_ref']}
      showValuePanel
    />
  ),
}

/** Read-only: transparent tone, no context menu, no replace/clear affordances. */
export const ReadOnly: Story = {
  name: 'Read only',
  render: () => (
    <ReferenceFieldDemo value={{_type: 'reference', _ref: 'author-tolstoy'}} readOnly />
  ),
}

let mintCounter = 0

/**
 * **Current (audit finding).** `reference-integrity` / `safe-exploration`: this is the
 * REAL create flow. Press "Create new", and before you have typed a single character
 * the component has already patched the parent document with a minted `_ref` (watch the
 * value panel) and created the draft it points to. The audit note: "cancel leaves a
 * dangling-ref error + orphan doc"; the Discard button below reproduces exactly that
 * end state. Harness limits: Studio opens the new draft in a child pane; here that pane
 * is narrated, not rendered, but the patches are the component's own.
 */
export const Current: Story = {
  name: 'Current (Create mints & binds before input)',
  tags: ['audit:needs-work'],
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Reference | undefined>(undefined)
      const [draftId, setDraftId] = useState<string | undefined>(undefined)
      const [discarded, setDiscarded] = useState(false)
      const [mountKey, setMountKey] = useState(0)

      const handleEditReference = (event: EditReferenceEvent) => {
        // Mirror what Studio does the instant "Create new" is pressed: an empty draft
        // document springs into existence, already pointed at by the parent document.
        universe.upsert({
          _id: getDraftId(event.id),
          _type: event.type,
          _rev: `rev-minted-${++mintCounter}`,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        } as SanityDocument)
        setDraftId(event.id)
        setMountKey((k) => k + 1)
      }

      const handleDiscard = () => {
        if (draftId) universe.remove(getDraftId(draftId))
        setDiscarded(true)
        setMountKey((k) => k + 1)
      }

      return (
        <Stack gap={3} style={{maxWidth: 520}}>
          <ReferenceFieldDemo
            key={mountKey}
            value={value}
            onValueChange={setValue}
            createOptions={[createAuthorOption]}
            onEditReference={handleEditReference}
            showValuePanel
          />
          {draftId && !discarded && (
            <>
              <Note>
                The reference is already bound: no title typed, nothing saved by you. Studio is now
                showing the new draft in a child pane. Closing it without input is the audit's
                failure path:
              </Note>
              <Flex>
                <UIButton
                  text="Discard the new draft (what cancel does)"
                  tone="critical"
                  onClick={handleDiscard}
                />
              </Flex>
            </>
          )}
          {discarded && (
            <Note tone="critical">
              The draft is gone, but the parent document still carries the minted <code>_ref</code>{' '}
              above, a dangling reference that will fail publish-time validation, created without
              the user ever entering data.
            </Note>
          )}
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * **Recommended.** Deferred binding: "Create new" opens a lightweight capture step and
 * nothing is written to the parent document until first meaningful input is committed.
 * Cancel is free: no draft, no reference, no cleanup (`safe-exploration` restored).
 * The binding patches applied on "Create & link" are byte-identical to the component's
 * own (weak + `_strengthenOnPublish` for a not-yet-published target).
 */
export const Recommended: Story = {
  name: 'Recommended (bind on first input)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => {
    function Demo() {
      const [value, setValue] = useState<Reference | undefined>(undefined)
      const [pendingName, setPendingName] = useState<string | undefined>(undefined)
      const [mountKey, setMountKey] = useState(0)

      const handleCreateAndLink = () => {
        if (!pendingName?.trim()) return
        const id = `author-created-${++mintCounter}`
        universe.upsert({
          _id: getDraftId(id),
          _type: 'author',
          _rev: `rev-created-${mintCounter}`,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
          name: pendingName.trim(),
        } as SanityDocument)
        // Same patch shape the real create flow emits for an unpublished target.
        setValue({
          _type: 'reference',
          _ref: id,
          _weak: true,
          _strengthenOnPublish: {type: 'author'},
        })
        setPendingName(undefined)
        setMountKey((k) => k + 1)
      }

      return (
        <Stack gap={3} style={{maxWidth: 520}}>
          <ReferenceFieldDemo
            key={mountKey}
            value={value}
            onValueChange={setValue}
            showValuePanel
          />
          {pendingName === undefined ? (
            <Flex>
              <UIButton text="Create new author" mode="ghost" onClick={() => setPendingName('')} />
            </Flex>
          ) : (
            <Card border padding={3} radius={2}>
              <Stack gap={3}>
                <Text size={1} weight="medium">
                  New author, nothing is created or linked yet
                </Text>
                <TextInput
                  placeholder="Name (first meaningful input)"
                  value={pendingName}
                  onChange={(event) => setPendingName(event.currentTarget.value)}
                />
                <Flex gap={2}>
                  <UIButton
                    text="Cancel, leaves no trace"
                    mode="bleed"
                    onClick={() => setPendingName(undefined)}
                  />
                  <UIButton
                    text="Create & link"
                    tone="primary"
                    disabled={!pendingName.trim()}
                    onClick={handleCreateAndLink}
                  />
                </Flex>
              </Stack>
            </Card>
          )}
        </Stack>
      )
    }
    return <Demo />
  },
}

/**
 * **Current (audit finding).** `autocompletion`: search is wired the way the audit
 * observed it behaving: type nonsense ("zzzz") and the popover confidently lists
 * every author in the dataset, none of them related to the query. The component
 * renders whatever hits the search observable returns; the defect lives in the
 * search seam, not the popover.
 */
export const CurrentNoMatch: Story = {
  name: 'Current (no-match returns unrelated results)',
  tags: ['audit:needs-work'],
  render: () => (
    <ReferenceFieldDemo
      focusPath={['_ref']}
      formFocusPath={['author']}
      onSearch={searchUnrelated}
    />
  ),
}

/**
 * **Recommended.** The honest empty state, and note that it already exists: with a
 * search function that returns `[]` for a no-match query, the component's built-in
 * "No results for …" message renders. The fix is entirely in search relevance;
 * no new UI is required.
 */
export const RecommendedNoMatch: Story = {
  name: 'Recommended (honest empty state)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => (
    <ReferenceFieldDemo focusPath={['_ref']} formFocusPath={['author']} onSearch={searchRelevant} />
  ),
}

/**
 * The template item `StudioReferenceInput` needs in `ReferenceInputOptions` context to
 * offer "Create new" — in Studio this comes from the document pane's resolved template
 * permissions; here only the members the `createOptions` mapper reads are real.
 */
const authorTemplateItem = {
  id: 'author',
  templateId: 'author',
  title: 'Author',
  granted: true,
  reason: 'granted',
  template: {id: 'author', schemaType: 'author'},
} as unknown as TemplatePermissionsResult

function PaneCard(props: {title: string; children: ReactNode}) {
  return (
    <Card border radius={2} padding={3} flex={1}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          {props.title}
        </Text>
        {props.children}
      </Stack>
    </Card>
  )
}

/**
 * The REAL create flow, fully rendered: a live `FormBuilder` over a `book` document
 * (so the reference field is the studio-wired `StudioReferenceInput`, createOptions and
 * all), and a second live `FormBuilder` over the minted author draft standing in for
 * Studio's child pane. The `onEditReference` context callback is the bridge: Studio uses
 * it to open the child pane; here it mounts the child form.
 */
function CurrentLiveDemo() {
  const [bookDoc, setBookDoc] = useState<SanityDocument | undefined>(undefined)
  const [child, setChild] = useState<{id: string; type: string} | undefined>(undefined)
  const [outcome, setOutcome] = useState<'none' | 'kept' | 'discarded'>('none')
  const [bookKey, setBookKey] = useState(0)

  const handleEditReference = useCallback((options: EditReferenceOptions) => {
    // By the time Studio receives this event the component has ALREADY patched the
    // parent and the draft is being created — mirror the draft into the universe and
    // open the child pane.
    universe.upsert({
      _id: getDraftId(options.id),
      _type: options.type,
      _rev: `rev-minted-${++mintCounter}`,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    } as SanityDocument)
    setChild({id: options.id, type: options.type})
    setOutcome('none')
  }, [])

  const handleCloseKeep = () => {
    setChild(undefined)
    setOutcome('kept')
    // Remount the book form so the reference preview re-reads the (mutated) universe.
    setBookKey((k) => k + 1)
  }

  const handleCloseDiscard = () => {
    if (child) universe.remove(getDraftId(child.id))
    setChild(undefined)
    setOutcome('discarded')
    setBookKey((k) => k + 1)
  }

  const boundRef = bookDoc?.author as Reference | undefined

  return (
    <ReferenceInputOptionsProvider
      EditReferenceLinkComponent={EditReferenceLinkStub as never}
      onEditReference={handleEditReference}
      initialValueTemplateItems={[authorTemplateItem]}
    >
      <Stack gap={3} style={{maxWidth: 960}}>
        <Flex gap={3} align="flex-start">
          <PaneCard title="Book, the parent document">
            <FormBuilderHarness
              key={`book-${bookKey}`}
              id="live-current-book"
              documentType="book"
              initialDocument={bookDoc ?? {_id: 'drafts.book-live-current', title: 'Anna Karenina'}}
              onDocumentChange={setBookDoc}
              height={340}
            />
          </PaneCard>
          {child && (
            <PaneCard title="Child pane, the new author draft (already created)">
              <FormBuilderHarness
                key={child.id}
                id="live-current-child"
                documentType="author"
                initialDocument={{_id: getDraftId(child.id), _type: 'author'}}
                onDocumentChange={(doc) => universe.upsert(doc)}
                height={220}
              />
              <Flex gap={2}>
                <UIButton text="Close pane (keep draft)" mode="ghost" onClick={handleCloseKeep} />
                <UIButton
                  text="Close without saving (cancel)"
                  tone="critical"
                  onClick={handleCloseDiscard}
                />
              </Flex>
            </PaneCard>
          )}
        </Flex>
        <ValuePanel value={boundRef} label="book.author (live document value)" />
        {child && (
          <Note>
            Look at the panel: the reference was bound the instant you pressed Create, before any
            input in the child pane. These are the component's own patches applied through the live
            form.
          </Note>
        )}
        {outcome === 'discarded' && (
          <Note tone="critical">
            The draft is gone but <code>book.author</code> still carries the minted{' '}
            <code>_ref</code>, the dangling reference the audit describes, now visible on the
            rendered field itself.
          </Note>
        )}
      </Stack>
    </ReferenceInputOptionsProvider>
  )
}

/**
 * The recommended flow on the same live form: the child pane still opens instantly, but
 * NOTHING is written to the parent document or the dataset until first meaningful input
 * is saved. Cancel is free at any point.
 */
function RecommendedLiveDemo() {
  const [bookDoc, setBookDoc] = useState<SanityDocument | undefined>(undefined)
  const [pendingId, setPendingId] = useState<string | undefined>(undefined)
  const [childDoc, setChildDoc] = useState<SanityDocument | undefined>(undefined)
  const [bookKey, setBookKey] = useState(0)

  const pendingName = typeof childDoc?.name === 'string' ? childDoc.name.trim() : ''

  const handleStartCreate = () => {
    setPendingId(`author-created-${++mintCounter}`)
    setChildDoc(undefined)
  }

  const handleCancel = () => {
    // No draft was ever created, no reference ever bound — nothing to clean up.
    setPendingId(undefined)
    setChildDoc(undefined)
  }

  const handleSaveAndLink = () => {
    if (!pendingId || !pendingName || !bookDoc) return
    universe.upsert({...childDoc, _id: getDraftId(pendingId)} as SanityDocument)
    // Same patch shape the real create flow emits for an unpublished target.
    setBookDoc({
      ...bookDoc,
      author: {
        _type: 'reference',
        _ref: pendingId,
        _weak: true,
        _strengthenOnPublish: {type: 'author'},
      },
    })
    setPendingId(undefined)
    setChildDoc(undefined)
    setBookKey((k) => k + 1)
  }

  const boundRef = bookDoc?.author as Reference | undefined

  return (
    <ReferenceInputOptionsProvider EditReferenceLinkComponent={EditReferenceLinkStub as never}>
      <Stack gap={3} style={{maxWidth: 960}}>
        <Flex gap={3} align="flex-start">
          <PaneCard title="Book, the parent document">
            <FormBuilderHarness
              key={`book-${bookKey}`}
              id="live-recommended-book"
              documentType="book"
              initialDocument={
                bookDoc ?? {_id: 'drafts.book-live-recommended', title: 'Anna Karenina'}
              }
              onDocumentChange={setBookDoc}
              height={340}
            />
            {!pendingId && (
              <Flex>
                <UIButton text="Create new author" mode="ghost" onClick={handleStartCreate} />
              </Flex>
            )}
          </PaneCard>
          {pendingId && (
            <PaneCard title="Child pane, nothing created or linked yet">
              <FormBuilderHarness
                key={pendingId}
                id="live-recommended-child"
                documentType="author"
                initialDocument={{_id: getDraftId(pendingId), _type: 'author'}}
                onDocumentChange={setChildDoc}
                height={220}
              />
              <Flex gap={2}>
                <UIButton text="Cancel, leaves no trace" mode="bleed" onClick={handleCancel} />
                <UIButton
                  text="Save & link"
                  tone="primary"
                  disabled={!pendingName}
                  onClick={handleSaveAndLink}
                />
              </Flex>
            </PaneCard>
          )}
        </Flex>
        <ValuePanel value={boundRef} label="book.author (live document value)" />
      </Stack>
    </ReferenceInputOptionsProvider>
  )
}

/**
 * **Current (audit finding), rendered.** The full create flow on a LIVE `FormBuilder`
 * (`lib/formBuilderHarness.tsx`): the reference field is the studio-wired
 * `StudioReferenceInput` whose "Create new" comes from real template items in
 * `ReferenceInputOptions` context, and the `onEditReference` callback, the exact hook
 * Studio uses to open the child pane, mounts a second live author form. Press Create:
 * the value panel shows the minted `_ref` bound to `book.author` before any input, the
 * child pane opens on the already-created draft, and "Close without saving" leaves the
 * dangling reference visible on the rendered field. This is the mint-and-bind sequence
 * of `ReferenceInput.handleCreateNew` on current code, unmodified.
 */
export const CurrentLive: Story = {
  name: 'Current, rendered (real child pane, bound on open)',
  tags: ['audit:needs-work'],
  render: () => <CurrentLiveDemo />,
}

/**
 * **Recommended, rendered.** Same live parent form, same child-pane experience, but
 * the pane opens on a purely local document: no draft in the dataset, no reference on
 * the parent, until "Save & link" (enabled by first meaningful input) applies the same
 * weak + `_strengthenOnPublish` patch shape the real flow uses. Cancel at any point
 * leaves no trace anywhere; `safe-exploration` restored with the identical editing
 * surface.
 */
export const RecommendedLive: Story = {
  name: 'Recommended, rendered (child pane, bind on save)',
  tags: ['!audit:needs-work', 'audit:holds'],
  render: () => <RecommendedLiveDemo />,
}
