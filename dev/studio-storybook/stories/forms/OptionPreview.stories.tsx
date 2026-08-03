import {
  type CrossDatasetReferenceSchemaType,
  type GlobalDocumentReferenceSchemaType,
} from '@sanity/types'
import {Box, Card, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {NEVER, type Observable, of, throwError} from 'rxjs'
import {delay} from 'rxjs/operators'

// Real components from real paths (org contract §8). Both of them, deliberately: the point of
// this page is that these two files are the same file twice.
import {OptionPreview as CrossDatasetOptionPreview} from '../../../../packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/OptionPreview'
import {type CrossDatasetReferenceInfo} from '../../../../packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/types'
import {OptionPreview as GlobalOptionPreview} from '../../../../packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/OptionPreview'
import {type GlobalDocumentReferenceInfo} from '../../../../packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/types'
import {WithStudioProviders} from '../../lib/testProvider'

const doc = {_id: 'author-borges', _type: 'author'}

/* ── The reference-type stubs ──────────────────────────────────────────────
   `OptionPreview` reads only `to`, plus `dataset`/`projectId` (cross-dataset) or
   `resourceType`/`resourceId` (global) which it forwards to the preview it renders. Casting a
   minimal literal keeps the story readable; the alternative is compiling a whole cross-dataset
   schema for two fields nothing under test reads. */

const crossType = {
  name: 'authorRef',
  type: 'crossDatasetReference',
  dataset: 'production',
  to: [{type: 'author', preview: {select: {title: 'name'}}}],
} as unknown as CrossDatasetReferenceSchemaType

const globalType = {
  name: 'authorRef',
  type: 'globalDocumentReference',
  resourceType: 'dataset',
  resourceId: 'proj.production',
  to: [{type: 'author', preview: {select: {title: 'name'}}}],
} as unknown as GlobalDocumentReferenceSchemaType

/* ── The six inputs, as observables ────────────────────────────────────────
   `OptionPreview` calls `useReferenceInfo` itself, so the only seam is the `getReferenceInfo`
   observable. That makes this a Studio-lane page: the observable is the component's own prop,
   and what it does with each emission is the behaviour under test. */

type AnyInfo = CrossDatasetReferenceInfo & GlobalDocumentReferenceInfo

const info = (over: Partial<AnyInfo>): AnyInfo =>
  ({
    id: 'author-borges',
    type: 'author',
    availability: {available: true, reason: 'READABLE'},
    preview: {published: {title: 'Jorge Luis Borges', subtitle: 'Modern'}},
    ...over,
  }) as AnyInfo

/** Never emits, so the hook stays on its initial loading state. */
const stayLoading = () => NEVER as Observable<never>
const fails = () => throwError(() => new Error('Cross-dataset token rejected (401)'))
/** `useReferenceInfo` maps a nullish emission to the empty state, which reaches `return null`. */
const emitsNothing = () => of(null as never).pipe(delay(0))
const denied = () => of(info({availability: {available: false, reason: 'PERMISSION_DENIED'}}))
const wrongType = () => of(info({type: 'illustrator'}))
const resolves = () => of(info({}))

const CASES: {
  id: string
  label: string
  note: string
  get: () => Observable<never>
}[] = [
  {
    id: 'loading',
    label: '1 · Loading',
    note: 'Two skeleton lines at the height the title and subtitle will take.',
    get: stayLoading,
  },
  {
    id: 'failed',
    label: '2 · Failed',
    note: 'The only branch that shows the underlying error text to the person.',
    get: fails as never,
  },
  {
    id: 'nothing',
    label: '3 · No info',
    note: 'Returns null. An option in a list that renders to nothing at all.',
    get: emitsNothing as never,
  },
  {
    id: 'denied',
    label: '4 · Permission denied',
    note: 'Bare i18n string with no Alert, no icon, no padding of its own.',
    get: denied as never,
  },
  {
    id: 'wrong-type',
    label: '5 · Undeclared type',
    note: 'The search returned a type this field does not accept.',
    get: wrongType as never,
  },
  {
    id: 'resolved',
    label: '6 · Resolved',
    note: 'The only success. Everything above it is a way of not getting here.',
    get: resolves as never,
  },
]

function Both({get}: {get: () => Observable<never>}) {
  return (
    <Stack gap={3} style={{maxWidth: 640}}>
      <Card border padding={2} radius={0}>
        <Box paddingBottom={2}>
          <Text muted size={0} weight="medium">
            CrossDatasetReferenceInput/OptionPreview
          </Text>
        </Box>
        <CrossDatasetOptionPreview
          document={doc}
          referenceType={crossType}
          getReferenceInfo={get as never}
        />
      </Card>
      <Card border padding={2} radius={0}>
        <Box paddingBottom={2}>
          <Text muted size={0} weight="medium">
            GlobalDocumentReferenceInput/OptionPreview
          </Text>
        </Box>
        <GlobalOptionPreview
          document={doc}
          referenceType={globalType}
          getReferenceInfo={get as never}
        />
      </Card>
    </Stack>
  )
}

function AllCases() {
  return (
    <Stack gap={5} style={{maxWidth: 680}}>
      {CASES.map((c) => (
        <Stack key={c.id} gap={2}>
          <Text size={1} weight="semibold">
            {c.label}
          </Text>
          <Text muted size={1}>
            {c.note}
          </Text>
          <Both get={c.get} />
        </Stack>
      ))}
    </Stack>
  )
}

const meta: Meta = {
  title: 'Forms & Input/OptionPreview',
  parameters: {
    // No meta-level `component`: each story drives state through observable input rather than
    // scalar props, so there is nothing for the controls panel to show.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Somewhere in the form layer sits the highest-branching unstoried component at seven ' +
            'measured states, and it exists twice: the same file, copied rather than shared, ' +
            'answering for both reference inputs that reach outside the current dataset.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/form/inputs/CrossDatasetReferenceInput/OptionPreview.tsx` and `packages/sanity/src/core/form/inputs/GlobalDocumentReferenceInput/OptionPreview.tsx` |',
          '| Tier | SERVICE. One row of a search dropdown, in the two reference inputs that reach outside the current dataset |',
          '| Audit | 🟡 needs-work (`reference-integrity`, `error-recovery`). The same component exists twice with no shared source, and three of its six outcomes render bare unstyled text |',
          '| Patterns | `reference-integrity` · `error-recovery` |',
          '| Measured states | 7, six real plus one unreachable |',
          '',
          'One result row in the picker for a cross-dataset or global-document reference. It ' +
            'resolves its own info, so every one of these rows is an independent request. Every ' +
            'story renders **both copies side by side**, which is the argument of this page.',
          '',
          '**What reading the two files turned up.**',
          '',
          '<details><summary><b>They are the same component twice.</b></summary>',
          '',
          'Diff them and the only differences are the imported preview ' +
            '(`CrossDatasetReferencePreview` vs `GlobalDocumentReferencePreview`), the identifiers ' +
            'forwarded to it (`dataset`/`projectId` vs `resourceType`/`resourceId`), and a ' +
            '`ReactNode` return annotation on one. Every branch, every guard, every i18n key and ' +
            'the order they are checked in is identical. A fix to one is a fix to one.',
          '',
          '</details>',
          '',
          '<details><summary><b>The last return re-checks what the guards already proved.</b></summary>',
          '',
          'The file ends with `return referenceInfo && refType && (<Preview …/>)`, but ' +
            '`if (!referenceInfo) return null` and `if (!refType) return …` have both already run. ' +
            'That `&&` chain can never take its falsy path. It is the seventh measured state and it ' +
            'is unreachable.',
          '',
          '</details>',
          '',
          '<details><summary><b>Three branches render bare strings.</b></summary>',
          '',
          'Permission-denied and undeclared-type return `<Stack>{t(…)}</Stack>` with no `Text`, so ' +
            'they inherit whatever typography the surrounding menu happens to set, while the ' +
            'failure branch gets a proper `Alert`. Compare the Permission Denied and Undeclared ' +
            'Type stories against Failed.',
          '',
          '</details>',
          '',
          '> **Why it matters:** these rows are what a person reads while choosing a document from ' +
            'another dataset. Three of the six outcomes tell them something went wrong, and the ' +
            'three do not look like they came from the same product.',
        ].join('\n'),
      },
    },
  },
  decorators: [WithStudioProviders({config: {schema: {name: 'storybook', types: []}}})],
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

/** Every branch, both copies, stacked. The reason this page exists. */
export const BranchMatrix: Story = {
  // Enumeration story: the docs canvas is 540px and this content is 1310px tall, so
  // 770px of it sat below an unscrolled fold on the page a reviewer actually reads.
  parameters: {docs: {story: {height: '1334px'}}},
  render: () => <AllCases />,
}

/** No emission yet: two skeleton lines sized to the title and subtitle that will replace them. */
export const Loading: Story = {
  render: () => <Both get={stayLoading} />,
}

/**
 * The observable errored. The only branch that puts the underlying message in front of the
 * person, and the only one wrapped in an `Alert`.
 */
export const Failed: Story = {
  render: () => <Both get={fails as never} />,
}

/**
 * The observable completed with nothing. `return null`, so the row occupies no space at all.
 * In a list of results that reads as a gap rather than as a row that failed.
 */
export const NoInfo: Story = {
  render: () => <Both get={emitsNothing as never} />,
}

/**
 * `availability.reason === 'PERMISSION_DENIED'`. An i18n string rendered directly inside a
 * `Stack` with no `Text` wrapper, so its size and tone come from wherever the menu put it.
 */
export const PermissionDenied: Story = {
  render: () => <Both get={denied as never} />,
}

/**
 * The search returned a `_type` the field does not declare in `to`. Same bare-string treatment
 * as permission-denied, and a different problem entirely.
 */
export const UndeclaredType: Story = {
  render: () => <Both get={wrongType as never} />,
}

/** The one success. */
export const Resolved: Story = {
  render: () => <Both get={resolves as never} />,
}
