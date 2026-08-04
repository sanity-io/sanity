import {type SanityDocument} from '@sanity/types'
import {Container, Stack} from '@sanity/ui'
import {type Decorator, type Meta, type StoryObj} from '@storybook/react-vite'
import {UserColorManagerContext} from 'sanity/_singletons'

// Real component from its real path (org contract §8): a single row in the scheduled
// publishing tool list, with its date, document preview, status and context menu. The
// scheduled-publishing folder is import-restricted (being deprecated); storying its live
// UI is a deliberate exception, so the two source imports carry a targeted, used disable,
// matching the folder's own cross-import convention.
// oxlint-disable-next-line no-restricted-imports -- documenting the still-shipping (deprecated) surface
import {ScheduleItem} from '../../../../packages/sanity/src/core/scheduled-publishing/components/scheduleItem'
// oxlint-disable-next-line no-restricted-imports -- documenting the still-shipping (deprecated) surface
import {type Schedule} from '../../../../packages/sanity/src/core/scheduled-publishing/types'
import {createUserColorManager} from '../../../../packages/sanity/src/core/user-color/manager'
import {createMockDocumentPreviewStore} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/**
 * A single `article` fixture the schedules point at. Seeded into the mock preview store
 * so the row's document preview (title + status dots) resolves through the real prepare
 * pipeline without any network.
 */
const scheduledDocument: SanityDocument = {
  _id: 'article-content-model-guide',
  _type: 'article',
  _rev: 'rev-article-1',
  _createdAt: '2027-01-05T09:00:00.000Z',
  _updatedAt: '2027-01-20T09:00:00.000Z',
  title: 'A field guide to content modelling',
}

const previewStore = createMockDocumentPreviewStore({documents: [scheduledDocument]})

// The row's author avatar (`UserAvatar`) reads its colour from the UserColorManager
// context, which the Studio provider stack normally supplies. Provide it directly, a
// scheme-fixed manager whose hues stay legible in both themes, mirroring
// `stories/status/UserAvatar.stories.tsx`. Without it every row throws
// `UserColorManager: missing context value`.
const colorManager = createUserColorManager({scheme: 'dark'})
const WithUserColor: Decorator = (Story) => (
  <UserColorManagerContext.Provider value={colorManager}>
    <Story />
  </UserColorManagerContext.Provider>
)

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
    preview: {select: {title: 'title'}},
  },
]

/** A schedule fixture with fixed timestamps (no `Date.now()`, deterministic renders). */
function makeSchedule(overrides: Partial<Schedule>): Schedule {
  return {
    id: 'sched-1',
    name: '2027-04-01 09:00',
    author: 'doug',
    action: 'publish',
    createdAt: '2027-03-01T09:00:00.000Z',
    dataset: 'mock-data-set',
    projectId: 'mock-project-id',
    description: '',
    documents: [{documentId: 'article-content-model-guide', documentType: 'article'}],
    executeAt: '2027-04-01T09:00:00.000Z',
    state: 'scheduled',
    stateReason: '',
    ...overrides,
  }
}

function ScheduleItemDemo(props: {schedule: Schedule}) {
  return (
    <Container width={2} padding={4}>
      <Stack gap={2}>
        <ScheduleItem schedule={props.schedule} type="tool" />
      </Stack>
    </Container>
  )
}

const meta: Meta = {
  title: 'Scheduling/Schedule Item',
  parameters: {
    docs: {
      description: {
        component: [
          "ScheduleItem renders a document's place in the publish queue as a single row an " +
            'editor can see and act on: the scheduled date, a live preview, a status indicator, ' +
            'and the actions available for that state.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/scheduled-publishing/components/scheduleItem/`, Studio-only (no DS equivalent) |',
          '| Tier | SERVICE. A composed list row: schedule date (time-zone formatted), the real document `Preview`, a status dot, and a permission-gated context menu. It reads its preview from the document preview store, so it is a service view, not a pure presentational leaf |',
          "| Audit | 🟡 partial (`content-versioning`, `working-memory`). The row is where a document's scheduled position in the publish lifecycle is made visible. The state (scheduled, succeeded, cancelled) is carried by tone and a small indicator rather than an explicit label, and the surrounding scheduled-publishing tool is deprecated (folding into Releases), the content-versioning context the audit flagged |",
          '| Patterns | `content-versioning` · `draft-publish-lifecycle` |',
          '',
          'It is a composed view rather than a leaf, it reads its preview live from the ' +
            'document preview store, so what renders is the same prepare pipeline the rest of ' +
            'Studio runs. Each story mounts the real `ScheduleItem` (`type="tool"`) on the studio ' +
            'provider stack (`lib/testProvider.tsx`) with a seeded mock preview store ' +
            '(`lib/mockDocumentPreviewStore.ts`) and fixed timestamps. The three stories cover ' +
            'the three schedule states; the context-menu actions differ per state, edit, ' +
            'publish-now, delete when upcoming, clear when completed, delete when failed.',
          '',
          '> **Why it matters:** the scheduled-publishing tool this row belongs to is ' +
            'deprecated and folding into Releases. Its folder is import-restricted, and storying ' +
            'its live UI carries a deliberate lint disable. Read this as documentation of a ' +
            'still-shipping surface on its way out, not a pattern to build new work on.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    WithStudioProviders({config: {schema: {name: 'storybook', types: schemaTypes}}, previewStore}),
    WithUserColor,
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'chapter:lists',
    'pattern:content-versioning',
    'pattern:draft-publish-lifecycle',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/** An upcoming schedule: edit / publish-now / delete are offered in the context menu. */
export const Upcoming: Story = {
  name: 'Upcoming (scheduled)',
  render: () => <ScheduleItemDemo schedule={makeSchedule({state: 'scheduled'})} />,
}

/** A completed schedule: the row offers only "clear completed schedule". */
export const Completed: Story = {
  name: 'Completed (succeeded)',
  render: () => (
    <ScheduleItemDemo
      schedule={makeSchedule({
        id: 'sched-2',
        state: 'succeeded',
        executedAt: '2027-04-01T09:00:03.000Z',
      })}
    />
  ),
}

/** A failed schedule: the row surfaces the failure reason and offers delete. */
export const Failed: Story = {
  name: 'Failed (cancelled)',
  render: () => (
    <ScheduleItemDemo
      schedule={makeSchedule({
        id: 'sched-3',
        state: 'cancelled',
        stateReason: 'The document had validation errors at publish time.',
      })}
    />
  ),
}
