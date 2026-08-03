import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {CircleIcon} from '@sanity/icons/Circle'
import {ClockIcon} from '@sanity/icons/Clock'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {Badge, type BadgeTone, Box, Card, Flex, MenuDivider, Stack, Text} from '@sanity/ui'
import {type Meta, type StoryObj} from '@storybook/react-vite'
import {type ComponentType, Fragment, type ReactNode} from 'react'

import {TasksList} from '../../../../packages/sanity/src/core/tasks/components/list/TasksList'
import {TasksUserAvatar} from '../../../../packages/sanity/src/core/tasks/components/TasksUserAvatar'
import {type TaskDocument} from '../../../../packages/sanity/src/core/tasks/types'
import {
  createUserServingClient,
  fixtureTasks,
  TasksStoryHarness,
} from '../../lib/mockCollabFixtures'
import {createMockPreviewUniverse} from '../../lib/mockDocumentPreviewStore'
import {WithStudioProviders} from '../../lib/testProvider'

/** Target document for tasks with a `target`: `DocumentPreview` resolves it live. */
const universe = createMockPreviewUniverse({
  documents: [
    {
      _id: 'article-launch',
      _type: 'article',
      _rev: 'rev-article-launch-1',
      _createdAt: '2026-06-20T09:00:00Z',
      _updatedAt: '2026-07-01T10:00:00Z',
      title: 'September launch announcement',
    },
  ],
})

const schemaTypes = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    preview: {select: {title: 'title'}},
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]

const meta: Meta = {
  title: 'Collaboration/Tasks',
  parameters: {
    // Every story drives `TasksList` with a fixed fixture array; no component prop type at
    // meta level to control.
    controls: {include: []},
    docs: {
      description: {
        component: [
          'Content has no named stages between draft and published, and Tasks, the closest ' +
            'thing Studio has to workflow, is a binary To Do/Done checkbox: state a team can ' +
            'neither see nor enforce.',
          '',
          '| | |',
          '|---|---|',
          '| Source | `packages/sanity/src/core/tasks/`. Studio-only, no DS equivalent |',
          '| Tier | SERVICE. The editorial-coordination layer (assignments, due dates, document targets) in the Studio sidebar; it orchestrates work around documents without being part of the edit loop |',
          '| Audit | 🔴 needs-work (`editorial-workflow-states`). `TASK_STATUS` in `packages/sanity/src/core/tasks/constants/TaskStatus.tsx` defines exactly `open` ("To Do") and `closed` ("Done"). No in-progress, no review, no approval |',
          '',
          "The stories mount the **real** `TasksList` (the tasks sidebar's list body) over fixture task documents. Assignee avatars resolve through the real `createUserStore` against a fixture-serving client; the document target chip resolves through the real preview pipeline (`useDocumentPreviewValues`) against a fixture universe. The status checkbox runs the real `useTaskOperations().edit()` against a stubbed addon-dataset client: toggling resolves, but the fixture list is static, so items do not move between groups.",
          '',
          'Harness notes: the three tasks singleton contexts (`TasksEnabledContext`, `TasksContext`, `TasksNavigationContext`) are value-seeded by `TasksStoryHarness` in `lib/mockCollabFixtures.tsx`, mirroring what `TasksProvider` and `TasksNavigationProvider` assemble at runtime, so empty states, which read the active sidebar tab from navigation context, render for real. Due dates are load-time offsets: the "due today" red treatment renders identically on any day.',
        ].join('\n'),
      },
    },
  },
  decorators: [
    (Story) => (
      <TasksStoryHarness>
        <Story />
      </TasksStoryHarness>
    ),
    WithStudioProviders({
      config: {schema: {name: 'storybook', types: schemaTypes}},
      client: createUserServingClient(),
      previewStore: universe.store,
    }),
  ],
  tags: [
    'autodocs',
    'chapter:cms',
    'pattern:editorial-workflow-states',
    'audit:needs-work',
    'source:studio-only',
    'tier:service',
  ],
}

export default meta
type Story = StoryObj

/**
 * The harness suspends while the mock workspace compiles, so play functions poll for
 * their trigger before acting. Plain DOM, no interaction-test dependency (same idiom
 * as the PortableText stories).
 */
function waitForElement(root: HTMLElement, selector: string, timeout = 8000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const poll = () => {
      const element = root.querySelector<HTMLElement>(selector)
      if (element) {
        resolve(element)
      } else if (Date.now() - startedAt > timeout) {
        reject(new Error(`Timed out waiting for ${selector}`))
      } else {
        setTimeout(poll, 100)
      }
    }
    poll()
  })
}

/** Sized like the tasks sidebar so the grouped list reads in context. */
function SidebarFrame(props: {children: ReactNode}) {
  const {children} = props
  return (
    <Box padding={3}>
      <Card border padding={3} radius={3} style={{width: 380}}>
        {children}
      </Card>
    </Box>
  )
}

const noopSelect = () => undefined

/**
 * The full list: three "To Do" tasks (one due **today**, the red treatment; one with
 * a resolved document-target chip; one unassigned, the placeholder avatar) and a
 * collapsed "Done" group. Checkboxes run the real edit operation against the stub
 * addon client.
 */
export const TaskList: Story = {
  name: 'Task list',
  parameters: {docs: {story: {height: '520px'}}},
  render: () => (
    <SidebarFrame>
      <TasksList items={fixtureTasks} onTaskSelect={noopSelect} />
    </SidebarFrame>
  ),
}

/**
 * Only open tasks: the fixture set omits the done task entirely, and, because
 * `TasksList` renders the "Done" group header collapsed regardless of contents, which
 * made this story load pixel-identical to Task list, the play function expands the
 * "Done" group with a real click, so the story lands showing the difference: the real
 * per-status empty state where Task list has a completed task. The empty-state copy is
 * tab-aware (this harness reports the "Assigned" tab).
 */
export const OpenOnly: Story = {
  name: 'Open tasks only',
  // Inline docs embeds skip play functions unless autoplay is set; without it the docs
  // page would regress to the collapsed, Task-list-identical rendering.
  parameters: {docs: {story: {autoplay: true}}},
  render: () => (
    <SidebarFrame>
      <TasksList
        items={fixtureTasks.filter((task) => task.status === 'open')}
        onTaskSelect={noopSelect}
      />
    </SidebarFrame>
  ),
  play: async ({canvasElement}) => {
    const doneSummary = await waitForElement(canvasElement, 'details:not([open]) summary')
    doneSummary.click()
  },
}

/** No tasks at all: the create-prompt empty state ("Create new task" is inert here). */
export const Empty: Story = {
  render: () => (
    <SidebarFrame>
      <TasksList items={[]} onTaskSelect={noopSelect} />
    </SidebarFrame>
  ),
}

// ---------------------------------------------------------------------------
// The audit pair: editorial-workflow-states
// ---------------------------------------------------------------------------

/**
 * **Current (audit finding).** The REAL workflow vocabulary, unmodified: every task is
 * either "To Do" or "Done" (`TaskStatus.tsx`, two entries, a checkbox between them).
 * A task that is being worked on, waiting on review, or blocked on approval is
 * indistinguishable from one nobody has started. The audit note: *"Tasks only
 * To Do/Done, no richer workflow."*
 */
export const CurrentWorkflow: Story = {
  name: 'Current (binary To Do / Done)',
  tags: ['audit:needs-work'],
  parameters: {docs: {story: {height: '520px'}}},
  render: () => (
    <SidebarFrame>
      <TasksList items={fixtureTasks} onTaskSelect={noopSelect} />
    </SidebarFrame>
  ),
}

interface MockStage {
  title: string
  icon: ComponentType
  tone: BadgeTone
  tasks: {task: TaskDocument; note?: string}[]
}

const [verifyPricing, altText, legalReview, outline] = fixtureTasks

const mockStages: MockStage[] = [
  {title: 'To Do', icon: CircleIcon, tone: 'default', tasks: [{task: altText}]},
  {
    title: 'In progress',
    icon: ClockIcon,
    tone: 'caution',
    tasks: [{task: verifyPricing, note: 'Started 2h ago'}],
  },
  {
    title: 'In review',
    icon: EyeOpenIcon,
    tone: 'primary',
    tasks: [{task: legalReview, note: 'Awaiting approval'}],
  },
  {title: 'Done', icon: CheckmarkCircleIcon, tone: 'positive', tasks: [{task: outline}]},
]

function MockStageGroup(props: {stage: MockStage}) {
  const {stage} = props
  const Icon = stage.icon
  return (
    <Stack gap={3}>
      <Flex align="center" gap={2}>
        <Text muted size={1}>
          <Icon />
        </Text>
        <Text muted size={1} weight="medium">
          {stage.title}
        </Text>
        <Badge fontSize={0} tone={stage.tone}>
          {stage.tasks.length}
        </Badge>
      </Flex>
      <Stack marginLeft={4} gap={3}>
        {stage.tasks.map(({task, note}, index) => (
          <Fragment key={task._id}>
            <Flex align="center" gap={2}>
              <Box flex={1}>
                <Stack gap={2}>
                  <Text size={1} textOverflow="ellipsis" weight="semibold">
                    {task.title}
                  </Text>
                  {note && (
                    <Text muted size={0}>
                      {note}
                    </Text>
                  )}
                </Stack>
              </Box>
              <TasksUserAvatar
                user={task.assignedTo ? {id: task.assignedTo} : undefined}
                withTooltip
              />
            </Flex>
            {index < stage.tasks.length - 1 && <MenuDivider />}
          </Fragment>
        ))}
      </Stack>
    </Stack>
  )
}

/**
 * **Recommended (mock).** The same tasks in a **named-stage** workflow, To Do →
 * In progress → In review → Done, each stage a visible, countable group with its own
 * tone, so where work stands is legible at a glance and enforceable at publish time.
 * The stage model is prop-driven mock data (Studio has no such primitive today);
 * avatars are the real `TasksUserAvatar` resolving fixture users.
 */
export const RecommendedWorkflow: Story = {
  name: 'Recommended (named stages)',
  tags: ['!audit:needs-work', 'audit:holds'],
  parameters: {docs: {story: {height: '520px'}}},
  render: () => (
    <SidebarFrame>
      <Stack gap={5}>
        {mockStages.map((stage) => (
          <MockStageGroup key={stage.title} stage={stage} />
        ))}
      </Stack>
    </SidebarFrame>
  ),
}
