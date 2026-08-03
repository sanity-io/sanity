import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {ClockIcon} from '@sanity/icons/Clock'
import {EditIcon} from '@sanity/icons/Edit'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). DocumentStatusIndicator is
// the compact status glyph: it renders one 5px coloured dot per live state
// (published / draft / release version), the row seen against list items and tabs.
import {DocumentStatusIndicator} from '../../../../packages/sanity/src/core/components/documentStatusIndicator/DocumentStatusIndicator'
import {type VersionInfoDocumentStub} from '../../../../packages/sanity/src/core/releases/store/types'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

// The component reads only `Boolean(draft)` / `Boolean(published)`; the full
// VersionInfoDocumentStub members are never touched, so a minimal cast stub is a
// faithful stand-in (mirrors how the component's own tests supply presence).
const stub = {_id: 'x', _rev: 'r', _createdAt: '', _updatedAt: ''} as VersionInfoDocumentStub

/** Wrap in a Card so the themed `--card-badge-*-dot-color` variables resolve. */
function DotRow({children, label}: {children: React.ReactNode; label: string}) {
  return (
    <Flex align="center" gap={3}>
      <Card padding={2} radius={2} shadow={1}>
        {children}
      </Card>
      <Text size={1} muted>
        {label}
      </Text>
    </Flex>
  )
}

const meta: Meta<typeof DocumentStatusIndicator> = {
  title: 'Document Status/Status Indicator',
  component: DocumentStatusIndicator,
  decorators: [WithStudioProviders()],
  render: (props) => (
    <Card padding={2} radius={2} shadow={1} style={{display: 'inline-block'}}>
      <DocumentStatusIndicator {...props} />
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          'This component is where the single most-cited status defect of the 8-product ' +
            'benchmark lives: state is carried by colour alone, on dots of identical shape and ' +
            'size, and in grayscale or to a colour-blind editor scanning a list, published and ' +
            'draft are indistinguishable.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/documentStatusIndicator/DocumentStatusIndicator.tsx`, Studio-only, no DS equivalent |',
          '| Tier | CHROME. A presentational status glyph: it maps each live document state to a themed dot colour and renders a small row of them. It derives its inputs from the draft model and active releases, but its output is pure visual signalling |',
          '| Audit | 🔴 needs-work (`similarity`, `draft-publish-lifecycle`). This component is where the most-cited status defect lives: status is conveyed by colour-only dots of identical shape and size (a 5px circle whose only variable is `--card-icon-color`). Published-vs-draft is unreadable in grayscale or to a colour-blind editor scanning a list |',
          '| Patterns | `similarity` · `draft-publish-lifecycle` |',
          '',
          'The tiny row of coloured status dots, the compact, label-less lifecycle signal seen ' +
            "next to list items and tabs. This is the smallest way Studio signals a document's " +
            'state: a 5px dot, one per live state, toned by status, published is positive, draft ' +
            'is caution, each active release version toned by its release type. It shows up ' +
            'wherever there is no room for words: list rows, tabs, tight lockups where a full ' +
            'label would not fit.',
          '',
          'Each dot maps a status to a badge colour: published to `positive`, draft to `caution`, ' +
            'and one dot per active release version toned by release type (`asap` / `scheduled` / ' +
            '`undecided`). The draft dot only shows when the workspace draft model is enabled; ' +
            'version dots only show for releases in the active-releases store, inert by default ' +
            'in this harness, so most stories render the published/draft matrix, while the ' +
            '`WithVersions` story seeds the store (`WithStudioProviders({releases})`) so all ' +
            'three release-type dots render through the real `useActiveReleases()` path. This is ' +
            'the compact sibling of Document Status/Document Status, which adds the missing text ' +
            'label.',
          '',
          '> **Why it matters:** the Current/Recommended pair below shows the fix in place, a ' +
            'distinct icon shape plus a label per state, not just a re-tinted dot.',
          '',
          'The page closes in context: the status dot scanned down a real author list, Austen ' +
            'published, Tolstoy edited, Lem draft-only.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lawsofux',
    'pattern:similarity',
    'pattern:draft-publish-lifecycle',
    'audit:needs-work',
    'source:studio-only',
    'tier:chrome',
  ],
}

export default meta
type Story = StoryObj<typeof DocumentStatusIndicator>

/** Published, no draft: a single positive-toned dot. */
export const PublishedOnly: Story = {
  args: {published: stub},
}

/** Draft, no published version: a single caution-toned dot. */
export const DraftOnly: Story = {
  args: {draft: stub},
}

/** Both present: two overlapping dots, the everyday "published with edits" state. */
export const DraftAndPublished: Story = {
  args: {published: stub, draft: stub},
}

/** The three states side by side, so the shape-identical dots are directly comparable. */
export const StatusMatrix: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      <DotRow label="published only">
        <DocumentStatusIndicator published={stub} />
      </DotRow>
      <DotRow label="draft only">
        <DocumentStatusIndicator draft={stub} />
      </DotRow>
      <DotRow label="draft + published">
        <DocumentStatusIndicator published={stub} draft={stub} />
      </DotRow>
    </Stack>
  ),
}

/**
 * The full stack: draft + published + one version dot per release type, resolved live
 * through `useActiveReleases()` against the seeded releases store. The story-level
 * decorator nests a seeded provider inside the file's inert one; React context takes
 * the innermost, so only this story sees the releases. Version dot tones come from
 * `metadata.releaseType` (`asap` / `scheduled` / `undecided`), and note they are
 * still shape-identical circles, which is exactly the `similarity` finding below.
 */
export const WithVersions: Story = {
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      <DotRow label="draft + published + asap + scheduled + undecided">
        <DocumentStatusIndicator
          published={stub}
          draft={stub}
          versions={{rAsap: stub, rScheduled: stub, rUndecided: stub}}
        />
      </DotRow>
      <DotRow label="asap only">
        <DocumentStatusIndicator versions={{rAsap: stub}} />
      </DotRow>
      <DotRow label="scheduled only">
        <DocumentStatusIndicator versions={{rScheduled: stub}} />
      </DotRow>
      <DotRow label="undecided only">
        <DocumentStatusIndicator versions={{rUndecided: stub}} />
      </DotRow>
    </Stack>
  ),
}

/**
 * **Current (audit finding).** `similarity`: the real component, three states in a
 * column. Every dot is the same 5px circle; only the tone differs. Rendered here
 * beside a grayscale swatch of the same row, once hue is gone, published, draft and
 * scheduled are indistinguishable. This is the single most-cited status defect of the
 * 8-product benchmark.
 */
export const Current: Story = {
  name: 'similarity, Current (colour-only dots)',
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={4}>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          As shipped, colour is the only signal
        </Text>
        <Flex gap={4}>
          <DotRow label="published">
            <DocumentStatusIndicator published={stub} />
          </DotRow>
          <DotRow label="draft">
            <DocumentStatusIndicator draft={stub} />
          </DotRow>
        </Flex>
      </Stack>
      <Stack gap={3}>
        <Text size={1} weight="medium" muted>
          The same row in grayscale, the states collapse
        </Text>
        <Flex gap={4} style={{filter: 'grayscale(1)'}}>
          <DotRow label="published?">
            <DocumentStatusIndicator published={stub} />
          </DotRow>
          <DotRow label="draft?">
            <DocumentStatusIndicator draft={stub} />
          </DotRow>
        </Flex>
      </Stack>
    </Stack>
  ),
}

/**
 * **Recommended.** Keep the tone, but pair each status with a distinct icon shape and
 * a label. A filled check for Published, a pencil for Draft, a clock for Scheduled,
 * each legible by shape alone. Rendered beside its own grayscale swatch to show the
 * signal survives. Shapes/labels are prop-driven; the underlying status derivation is
 * unchanged.
 */
export const Recommended: Story = {
  name: 'similarity, Recommended (shape + label per state)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const statuses: {label: string; tone: 'positive' | 'caution'; icon: typeof EditIcon}[] = [
      {label: 'Published', tone: 'positive', icon: CheckmarkCircleIcon},
      {label: 'Draft', tone: 'caution', icon: EditIcon},
      {label: 'Scheduled', tone: 'caution', icon: ClockIcon},
    ]
    const LegibleStatus = ({grayscale}: {grayscale?: boolean}) => (
      <Card
        padding={2}
        radius={2}
        shadow={1}
        style={grayscale ? {filter: 'grayscale(1)'} : undefined}
      >
        <Flex gap={3}>
          {statuses.map(({label, tone, icon: Icon}) => (
            <Flex key={label} align="center" gap={1}>
              <Text size={1}>
                <Icon style={{color: `var(--card-badge-${tone}-icon-color)`}} />
              </Text>
              <Text size={0}>{label}</Text>
            </Flex>
          ))}
        </Flex>
      </Card>
    )
    return (
      <Stack gap={4}>
        <Stack gap={3}>
          <Text size={1} weight="medium">
            Shape + label, legible with colour
          </Text>
          <LegibleStatus />
        </Stack>
        <Stack gap={3}>
          <Text size={1} weight="medium" muted>
            The same row in grayscale, still legible
          </Text>
          <LegibleStatus grayscale />
        </Stack>
      </Stack>
    )
  },
}

/** For reference: the raw color-only dot the component draws, enlarged and labelled. */
export const DotAnatomy: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Flex gap={5} align="center">
      {(['positive', 'caution'] as const).map((tone) => (
        <Stack key={tone} gap={2} style={{textAlign: 'center'}}>
          <Text size={4}>
            <CircleIcon style={{color: `var(--card-badge-${tone}-dot-color)`}} />
          </Text>
          <Text size={0} muted>
            {tone === 'positive' ? 'published' : 'draft'} (`--card-badge-{tone}-dot-color`)
          </Text>
        </Stack>
      ))}
    </Flex>
  ),
}

/**
 * **In context.** An author list, the way you scan it in the structure pane: each row a
 * document, the status dot at the end carrying its lifecycle state. Jane Austen is
 * published, Leo Tolstoy is published with unsaved edits, Stanisław Lem is a draft that has
 * never gone live. This is the indicator's real job, the label-less signal you read down a
 * column at a glance (and, per the finding above, the one that collapses in grayscale).
 */
export const InContext: Story = {
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {
      title: string
      published?: VersionInfoDocumentStub
      draft?: VersionInfoDocumentStub
    }[] = [
      {title: 'Jane Austen', published: stub},
      {title: 'Leo Tolstoy', published: stub, draft: stub},
      {title: 'Stanisław Lem', draft: stub},
    ]
    return (
      <Card radius={2} shadow={1} style={{maxWidth: 320, overflow: 'hidden'}}>
        <Stack>
          {rows.map(({title, published, draft}) => (
            <Flex key={title} align="center" justify="space-between" gap={3} padding={3}>
              <Text size={1}>{title}</Text>
              <DocumentStatusIndicator published={published} draft={draft} />
            </Flex>
          ))}
        </Stack>
      </Card>
    )
  },
}
