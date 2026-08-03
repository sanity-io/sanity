import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {ClockIcon} from '@sanity/icons/Clock'
import {EditIcon} from '@sanity/icons/Edit'
import {type PreviewValue} from '@sanity/types'
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'

// Real component from its real path (org contract §8). DocumentStatus is the
// multi-line lifecycle readout: it composes the draft model flag, active releases,
// i18n and relative-time formatting into a "Published … / Draft edited …" lockup.
import {DocumentStatus} from '../../../../packages/sanity/src/core/components/documentStatus/DocumentStatus'
import {type VersionInfoDocumentStub} from '../../../../packages/sanity/src/core/releases/store/types'
import {fixtureReleases, WithStudioProviders} from '../../lib/testProvider'

// Timestamps are expressed relative to load so the component's `useRelativeTime`
// renders natural phrases ("just now", "8m ago", "3d ago") rather than fixed dates.
const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const ago = (ms: number) => new Date(Date.now() - ms).toISOString()

/** A minimal preview stub — DocumentStatus reads only `_updatedAt` off each side. */
const at = (ms: number): PreviewValue => ({_updatedAt: ago(ms)}) as PreviewValue

// Version rows additionally read `_createdAt` to pick the "created" vs "edited"
// label (equal timestamps → created). `_id`/`_rev`/`_system` are never touched, so
// the cast stub idiom matches DocumentStatusIndicator.stories.tsx.
const versionAt = (updatedMsAgo: number, createdMsAgo = updatedMsAgo) =>
  ({_updatedAt: ago(updatedMsAgo), _createdAt: ago(createdMsAgo)}) as VersionInfoDocumentStub

const publishedRecent = at(3 * DAY)
const draftRecent = at(8 * MINUTE)

/** Wrap in a Card so the themed `--card-*` colour variables resolve, as in Studio. */
function StatusRow({children}: {children: React.ReactNode}) {
  return (
    <Card padding={3} radius={2} shadow={1} style={{maxWidth: 360}}>
      {children}
    </Card>
  )
}

const meta: Meta<typeof DocumentStatus> = {
  title: 'Document Status/Document Status',
  component: DocumentStatus,
  decorators: [WithStudioProviders()],
  render: (props) => (
    <StatusRow>
      <DocumentStatus {...props} />
    </StatusRow>
  ),
  parameters: {
    docs: {
      description: {
        component: [
          "The text label and timestamp are DocumentStatus's saving grace, but the leading glyph " +
            'is the same circle for every lifecycle state, told apart by hue alone; strip colour ' +
            'and Published and Draft are identical.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/components/documentStatus/DocumentStatus.tsx`, Studio-only, no DS equivalent |',
          '| Tier | SERVICE. It composes several domain reads (the workspace draft-model flag, active releases, i18n, relative-time formatting) into a single lifecycle readout; not a pure atom, not core editing machinery |',
          '| Audit | 🔴 needs-work (`draft-publish-lifecycle`, `working-memory`, `similarity`). The CMS chapter marks the draft→published lifecycle as under-surfaced. DocumentStatus is the strongest existing answer: it keeps the position visible with a text label and timestamp at all times, so it largely satisfies draft-publish-lifecycle/working-memory. The residual similarity weakness is that its leading glyph is a same-shape coloured dot, distinguished by hue |',
          '| Patterns | `draft-publish-lifecycle` · `working-memory` · `similarity` |',
          '',
          'The multi-line readout of where a document sits in its lifecycle: a labelled line each ' +
            'for Published, Draft, and every active release version. Editors live by one ' +
            "question: is what I'm looking at published, still a draft, or scheduled in a " +
            'release? DocumentStatus is the fullest answer Studio gives, a stacked readout with ' +
            'one line per live state, each pairing a glyph with a translated "Published 3 days ' +
            'ago" / "Edited 8m ago" phrase. Because it keeps that position visible with real ' +
            'words and a timestamp at all times, it is the strongest thing Studio has going for ' +
            'the otherwise under-surfaced draft-to-published lifecycle.',
          '',
          'Renders one line per live state, Published, Draft, and one per active release version, ' +
            'each as a `ReleaseAvatar` glyph plus a translated "Published {date}" / "Edited ' +
            '{date}" phrase. The draft line only appears when the workspace has the draft model ' +
            'enabled (`document.drafts.enabled`), and version lines only render for releases ' +
            'present in the active-releases store. That store is inert by default in this ' +
            'harness, so most stories render the draft/published matrix; the `WithVersions` story ' +
            'seeds it (`WithStudioProviders({releases})`) so release lines render live, title, ' +
            'release-type glyph tone (`asap` / `scheduled` / `undecided`) and created/edited ' +
            'phrasing all resolved through the real `useActiveReleases()` path.',
          '',
          '> **Why it matters:** the Current/Recommended pair keeps the copy and gives each ' +
            'lifecycle state a distinct icon shape, so the status survives a grayscale render and ' +
            'not only the tinted dot.',
          '',
          'The page closes in context: the full lifecycle readout under the Leo Tolstoy document ' +
            'header, published, draft-edited, and three release versions at once.',
        ].join('\n'),
      },
    },
  },
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lawsofux',
    'pattern:draft-publish-lifecycle',
    'pattern:working-memory',
    'pattern:similarity',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj<typeof DocumentStatus>

/** Published with no draft: a single published-date line. */
export const PublishedOnly: Story = {
  args: {published: publishedRecent},
}

/** Draft with no published version: a single edited-date line. */
export const DraftOnly: Story = {
  args: {draft: draftRecent},
}

/** Both sides present, the everyday "published, with unpublished edits" state. */
export const DraftAndPublished: Story = {
  args: {published: publishedRecent, draft: draftRecent},
}

/**
 * `singleLine`: the same content laid out as a horizontal row for tight lockups. The
 * component lays the status rows out with `wrap="nowrap"` but applies **no truncation** to
 * the phrases (`VersionStatus` renders a plain `Text`), so the row needs a container wide
 * enough for its natural width, the default 360px `StatusRow` is too narrow and forces the
 * inner text to wrap mid-phrase ("Edited 3 days" / "ago"), defeating the single-line intent.
 * This story sizes its card to content so the row renders on one line as designed.
 */
export const SingleLine: Story = {
  args: {published: publishedRecent, draft: draftRecent, singleLine: true},
  parameters: {controls: {include: []}},
  render: (props) => (
    <Card padding={3} radius={2} shadow={1} style={{width: 'fit-content', maxWidth: 'none'}}>
      <DocumentStatus {...props} />
    </Card>
  ),
}

/**
 * The relative-time formatter across ages: a just-saved draft over a published
 * version edited minutes, hours and days ago all read naturally.
 */
export const TimestampAges: Story = {
  parameters: {controls: {include: []}},
  render: () => (
    <Stack gap={3}>
      {[
        {label: 'seconds', published: at(20 * 1000), draft: at(5 * 1000)},
        {label: 'minutes', published: at(2 * HOUR), draft: at(8 * MINUTE)},
        {label: 'days', published: at(9 * DAY), draft: at(3 * DAY)},
      ].map(({label, published, draft}) => (
        <StatusRow key={label}>
          <DocumentStatus published={published} draft={draft} />
        </StatusRow>
      ))}
    </Stack>
  ),
}

/**
 * All lifecycle rows at once: Published, Draft, and one line per release version,
 * resolved live through `useActiveReleases()` against the seeded releases store
 * (story-level decorator nests a seeded provider inside the file's inert one; the
 * innermost context wins). Each release line shows the release title, its
 * type-toned `ReleaseAvatar` glyph (bolt = asap, clock = scheduled, dot =
 * undecided), and created-vs-edited phrasing, the undecided version uses equal
 * created/updated timestamps to exercise the "created" label.
 */
export const WithVersions: Story = {
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {controls: {include: []}},
  render: () => (
    <StatusRow>
      <DocumentStatus
        published={publishedRecent}
        draft={draftRecent}
        versions={{
          rAsap: versionAt(2 * HOUR, 2 * DAY),
          rScheduled: versionAt(1 * DAY, 5 * DAY),
          rUndecided: versionAt(3 * DAY),
        }}
      />
    </StatusRow>
  ),
}

/**
 * **Current (audit finding).** `similarity`: the real component. Each lifecycle
 * state does carry a text label, its saving grace, but the leading indicator is
 * `ReleaseAvatar`'s `DotIcon`: the same circle shape for Published and Draft,
 * separated only by tone. Strip colour and the two glyphs are identical.
 */
export const Current: Story = {
  name: 'similarity, Current (leading dot is shape-identical)',
  parameters: {controls: {include: []}},
  render: () => (
    <StatusRow>
      <DocumentStatus published={publishedRecent} draft={draftRecent} />
    </StatusRow>
  ),
}

/**
 * **Recommended.** Keep the label and timestamp exactly as shipped, but pair each
 * state with a distinct icon shape, a filled check for Published, a pencil for
 * Draft, a clock for a scheduled version. The status now reads by shape as well as
 * hue, so it survives grayscale and colour-blind rendering. Shapes only; the copy
 * mirrors the real component's "state, relative date" lockup.
 */
export const Recommended: Story = {
  name: 'similarity, Recommended (distinct shape per state)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {controls: {include: []}},
  render: () => {
    const rows: {
      label: string
      date: string
      tone: 'positive' | 'caution'
      icon: typeof EditIcon
    }[] = [
      {label: 'Published', date: '3d ago', tone: 'positive', icon: CheckmarkCircleIcon},
      {label: 'Draft', date: 'Edited 8m ago', tone: 'caution', icon: EditIcon},
      {label: 'Scheduled', date: 'Publishes in 2d', tone: 'caution', icon: ClockIcon},
    ]
    return (
      <StatusRow>
        <Stack gap={3}>
          {rows.map(({label, date, tone, icon: Icon}) => (
            <Flex key={label} align="center" gap={2}>
              <Text size={1} muted>
                <Icon style={{color: `var(--card-badge-${tone}-icon-color)`}} data-tone={tone} />
              </Text>
              <Text size={1}>
                {label} <span style={{color: 'var(--card-muted-fg-color)'}}>· {date}</span>
              </Text>
            </Flex>
          ))}
        </Stack>
      </StatusRow>
    )
  },
}

/**
 * **In context.** The document header for *Leo Tolstoy*, the `author` an editor has open,
 * published three days ago, carrying unpublished edits from eight minutes ago, and queued
 * into three releases (Hotfix launch, Spring campaign, Someday ideas). This is
 * DocumentStatus doing its real job: the full "where is this document in its lifecycle"
 * readout sitting under the title, where the editor glances to answer "is what I'm looking
 * at live?". Release lines resolve through the real `useActiveReleases()` path against the
 * seeded store.
 */
export const InContext: Story = {
  decorators: [WithStudioProviders({releases: fixtureReleases})],
  parameters: {controls: {include: []}},
  render: () => (
    <Card padding={4} radius={3} shadow={1} style={{maxWidth: 420}}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Text size={0} muted weight="medium">
            Author
          </Text>
          <Text size={4} weight="semibold">
            Leo Tolstoy
          </Text>
        </Stack>
        <DocumentStatus
          published={publishedRecent}
          draft={draftRecent}
          versions={{
            rAsap: versionAt(2 * HOUR, 2 * DAY),
            rScheduled: versionAt(1 * DAY, 5 * DAY),
            rUndecided: versionAt(3 * DAY),
          }}
        />
      </Stack>
    </Card>
  ),
}
