import {type ObjectSchemaType, type Path} from '@sanity/types'
import {Box, Card, Flex, LayerProvider, Stack, Text, TextInput} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type PropsWithChildren, useMemo} from 'react'
import {ActiveWorkspaceMatcherContext, UserColorManagerContext} from 'sanity/_singletons'
import {styled} from 'styled-components'

import {type WorkspaceSummary} from '../../../../packages/sanity/src/core/config/types'
import {DivergenceCollectionIndicator} from '../../../../packages/sanity/src/core/divergence/components/DivergenceCollectionIndicator'
import {DivergenceDetail} from '../../../../packages/sanity/src/core/divergence/components/DivergenceDetail'
import {DivergenceIndicator} from '../../../../packages/sanity/src/core/divergence/components/DivergenceIndicator'
import {
  type DivergenceNavigator,
  type ReachableDivergenceAtPath,
} from '../../../../packages/sanity/src/core/divergence/divergenceNavigator'
import {pathToAnchorIdent} from '../../../../packages/sanity/src/core/form/utils/pathToAnchorIdent'
import {useSchema} from '../../../../packages/sanity/src/core/hooks/useSchema'
import {useWorkspace} from '../../../../packages/sanity/src/core/studio/workspace'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'
import {
  createDivergenceFixtureClient,
  createFixtureDivergence,
  DIVERGENCE_SUBJECT_ID,
  DIVERGENCE_UPSTREAM_ID,
  divergenceFixtureDocuments,
  divergenceFixtureRevisions,
  useFixtureDivergenceNavigator,
} from '../../lib/divergenceFixtures'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

const schemaTypes = [
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'subtitle', title: 'Subtitle', type: 'string'},
    ],
    preview: {select: {title: 'title', subtitle: 'subtitle'}},
  },
]

const divergenceClient = createDivergenceFixtureClient({
  documents: divergenceFixtureDocuments,
  revisions: divergenceFixtureRevisions,
})

// The diff renderers (`DiffString` under the string field-diff component) read
// annotation colors through `useUserColorManager`, which throws without a
// provider. Providing the context VALUE directly needs no color-scheme context.
// (Static light-scheme tints; the dark theme toggle keeps working, diff
// highlights just stay light-tuned.)
const userColorManager = createUserColorManager({scheme: 'light'})

/**
 * The upstream release the subject forked from, as `useVersionRelease` resolves
 * it from the seeded releases store ("Spring campaign", `rScheduled`).
 */
const upstreamRelease = fixtureReleases.find((release) => release._id === '_.releases.rScheduled')!

/**
 * In the real form, every input wrapper declares a CSS `anchor-name` derived
 * from its path (`pathToAnchorIdent('input', path)`); the indicator button and
 * the detail overlay position themselves against it with CSS anchor
 * positioning. This target reproduces that contract for a standalone field row.
 */
const AnchorTarget = styled.div<{$anchor: string}>`
  anchor-name: ${({$anchor}) => $anchor};
`

const subjectDocument = divergenceFixtureDocuments.find((doc) => doc._id === DIVERGENCE_SUBJECT_ID)!

const FIELD_TITLES: Record<string, string> = {title: 'Title', subtitle: 'Subtitle'}

function DivergentFieldRow(props: {
  fieldName: string
  navigator: DivergenceNavigator
  entry: ReachableDivergenceAtPath
}) {
  const {fieldName, navigator, entry} = props
  const path: Path = [fieldName]
  return (
    <Card border padding={3} radius={2}>
      <Flex align="center" gap={3}>
        <Stack flex={1} gap={2}>
          <Text size={1} weight="medium">
            {FIELD_TITLES[fieldName]}
          </Text>
          <AnchorTarget $anchor={pathToAnchorIdent('input', path)}>
            <TextInput fontSize={1} readOnly value={String(subjectDocument[fieldName] ?? '')} />
          </AnchorTarget>
        </Stack>
        <div style={{position: 'relative', width: 33, height: 33}}>
          <DivergenceIndicator
            divergence={entry[1]}
            divergenceNavigator={navigator}
            path={path}
            upstreamBundle={upstreamRelease}
          />
        </div>
      </Flex>
    </Card>
  )
}

/**
 * A two-field slice of the subject document ("Hotfix launch" copy of
 * `book-war`) whose upstream ("Spring campaign") changed both fields after the
 * fork. Divergences are transposed fixtures; everything below the navigator,
 * indicator buttons, the resolution overlay, the base-to-head diff, the
 * Ignore / Copy-from-base operations, is the real component tree running
 * against the fixture client and the real document store.
 */
function ResolutionDemo(props: {readOnly?: boolean; initialFocus?: string}) {
  const {readOnly = false, initialFocus} = props
  const schema = useSchema()
  const bookType = schema.get('book') as ObjectSchemaType

  const entries = useMemo<ReachableDivergenceAtPath[]>(
    () =>
      ['title', 'subtitle'].map((fieldName) => {
        const field = bookType.fields.find((candidate) => candidate.name === fieldName)!
        return [
          fieldName,
          createFixtureDivergence({
            path: fieldName,
            schemaType: field.type,
            documentType: 'book',
          }),
        ]
      }),
    [bookType],
  )

  const navigator = useFixtureDivergenceNavigator(entries, DIVERGENCE_UPSTREAM_ID, initialFocus)
  const focusedEntry = entries.find(([path]) => path === navigator.state.focusedDivergence)

  return (
    <Box padding={4} style={{maxWidth: 560}}>
      <Stack gap={4}>
        {entries.map((entry) => (
          <DivergentFieldRow
            key={entry[0]}
            fieldName={entry[0]}
            navigator={navigator}
            entry={entry}
          />
        ))}
      </Stack>
      {focusedEntry && (
        // The form integration (`FormNodeDivergenceDetail`) portals the panel
        // inside `LayerProvider zOffset={1}` so the anchored overlay stacks
        // above field chrome (Sanity UI inputs sit at z-index 1). Mirror the
        // layer bump here, without it the overlay's layer resolves to 0 and
        // covered field text paints through the panel.
        <LayerProvider zOffset={10}>
          <DivergenceDetail
            divergence={focusedEntry[1]}
            divergenceNavigator={navigator}
            readOnly={readOnly}
          />
        </LayerProvider>
      )}
    </Box>
  )
}

/**
 * Two contexts the resolution path needs beyond `WithStudioProviders`:
 * - `ActiveWorkspaceMatcherContext`: `useDocumentOperation` (the resolution
 *   actions' patch channel) routes through the comlink-history variant, which
 *   reads `useActiveWorkspace()`. The mock workspace stands in for the summary
 *   (structureHarness idiom).
 * - `UserColorManagerContext`: the diff annotation colors (see above).
 */
function DivergenceEnvironment({children}: PropsWithChildren) {
  const workspace = useWorkspace()
  const activeWorkspaceValue = useMemo(
    () => ({
      activeWorkspace: workspace as unknown as WorkspaceSummary,
      setActiveWorkspace: () => undefined,
    }),
    [workspace],
  )
  return (
    <ActiveWorkspaceMatcherContext.Provider value={activeWorkspaceValue}>
      <UserColorManagerContext.Provider value={userColorManager}>
        {children}
      </UserColorManagerContext.Provider>
    </ActiveWorkspaceMatcherContext.Provider>
  )
}

const meta: Meta = {
  title: 'Versioning/Divergences',
  decorators: [
    (Story) => (
      <DivergenceEnvironment>
        <Story />
      </DivergenceEnvironment>
    ),
    WithStudioProviders({
      config: {
        schema: {name: 'mock', types: schemaTypes},
        advancedVersionControl: {enabled: true},
      },
      client: divergenceClient,
      releases: fixtureReleases,
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          'Version control has a hard half: two people edit the same content down different ' +
            'paths, and eventually the paths have to meet. Divergences is how Studio makes that ' +
            'reconciliation legible instead of a merge conflict in the dark.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/divergence/` (+ `core/form/components/FormDivergence*` at the form seam), Studio-only (no DS equivalent) |',
          "| Flag | `advancedVersionControl.enabled`, default OFF (`core/config/types.ts`, `boolean \\| ComposableOption`). When enabled, the form tracks per-node divergences: places where a version document's upstream (published or another release) changed after the version forked from it |",
          '| Tier | SERVICE. Resolution machinery layered over the document store, history API and `@sanity/diff`; it decorates the form rather than replacing editing core |',
          "| Audit | 🔴 needs-work (`content-versioning`). The benchmark scored Studio's versioning surfaces as under-explained; divergences are the resolution half of Advanced Version Control (chapter-14 content-versioning territory) and currently ship with no in-product narrative at all |",
          '| Patterns | `content-versioning` |',
          '',
          'A pencil beside each field that moved, and a side-by-side of what changed upstream so ' +
            'the editor can choose. If you are building on Advanced Version Control, this is the ' +
            'surface authors will actually feel.',
          '',
          'A divergence is detected per document node by comparing three snapshots: the upstream ' +
            'at the fork point, the upstream head, and the subject head. The editor sees a ' +
            'pencil indicator beside each diverged field; focusing one opens the resolution ' +
            'overlay showing the upstream base-to-head diff (computed live by `@sanity/diff` ' +
            "and rendered by the field's real diff component) with two resolutions: Ignore " +
            '(mark resolved at the current upstream revision) or Copy from base (take the ' +
            'upstream value).',
          '',
          'These stories enter at the navigator seam (`lib/divergenceFixtures.ts`): the ' +
            'divergence records and navigator state are fixtures, but the resolution panel ' +
            'fetches its data through the real paths, `getDocumentAtRevision` against the ' +
            'history endpoint (fork snapshot) and `documentStore.pair.editState` (upstream ' +
            'head), so the diff you see is genuinely computed from the two fixture documents.',
          '',
          '> **Why it matters:** every field offers two resolutions and they are not symmetric. ' +
            'Ignore marks the divergence resolved at the current upstream revision without ' +
            'changing your value; Copy from base overwrites your value with the upstream one. ' +
            'An author who reaches for the wrong one loses their edit, so the label and the ' +
            'diff have to make the consequence obvious before the click.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:content-versioning',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
    'flag:advancedVersionControl.enabled',
  ],
}

export default meta
type Story = StoryObj

/**
 * The resolution surface, focused on `title`: overlay summary ("Title changed
 * in Spring campaign version"), the live base-to-head string diff, Ignore /
 * Copy-from-base actions, and 1-of-2 pagination. Next/Previous cycle focus
 * between the two diverged fields, moving the anchored overlay with them.
 * Clicking a field's pencil indicator toggles its overlay, exactly like the
 * form integration (`FormNodeDivergenceDetail`).
 */
export const ResolutionPanel: Story = {
  parameters: {docs: {story: {inline: false, height: '560px'}}},
  render: () => <ResolutionDemo initialFocus="title" />,
}

/**
 * The same surface with nothing focused: the resting state an editor lands in,
 * two pencil indicators marking diverged fields, overlay closed until one is
 * clicked.
 */
export const FieldIndicators: Story = {
  parameters: {docs: {story: {inline: false, height: '400px'}}},
  render: () => <ResolutionDemo />,
}

/**
 * Read-only review: the overlay opens and the diff renders, but both
 * resolution actions are disabled, the state a viewer-role editor gets.
 */
export const ResolutionPanelReadOnly: Story = {
  parameters: {docs: {story: {inline: false, height: '560px'}}},
  render: () => <ResolutionDemo initialFocus="title" readOnly />,
}

/**
 * The collection indicator (`DivergenceCollectionIndicator`): shown on
 * container nodes (objects/arrays), it counts descendant divergences and
 * focuses the first one on click. Tone encodes the upstream: green when the
 * upstream is the published document, purple when it is another release.
 */
export const CollectionIndicators: Story = {
  render: () => (
    <Flex gap={4} padding={4}>
      <Stack gap={3}>
        <Text muted size={1}>
          Upstream: published
        </Text>
        <Box>
          <DivergenceCollectionIndicator
            divergenceCount={1}
            upstreamId="book-war"
            upstreamBundle="published"
          />
        </Box>
      </Stack>
      <Stack gap={3}>
        <Text muted size={1}>
          Upstream: release version
        </Text>
        <Box>
          <DivergenceCollectionIndicator
            divergenceCount={3}
            upstreamId={DIVERGENCE_UPSTREAM_ID}
            upstreamBundle={upstreamRelease}
          />
        </Box>
      </Stack>
    </Flex>
  ),
}
