import {takeSnapshot} from '@chromatic-com/vitest'
import {type SanityClient} from '@sanity/client'
import {useCallback, useState} from 'react'
import {of} from 'rxjs'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'
import {route, RouterProvider, type RouterState} from 'sanity/router'
import {SWRConfig} from 'swr'
import {Flex, VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {LocaleProvider} from '../../../i18n/components/LocaleProvider'
import {SCHEDULE_FILTERS} from '../../constants'
import {type Schedule} from '../../types'
import {SchedulesProvider} from '../contexts/schedules'
import ScheduleFilter from '../scheduleFilters/ScheduleFilter'
import {Schedules} from '../schedules/Schedules'
import Tool from '../Tool'
import {CalendarDay} from '../toolCalendar/CalendarDay'

const SCHEMA_TYPES = [
  {
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [{name: 'title', title: 'Title', type: 'string'}],
  },
]

// `doug` is the mock workspace's current user, so the avatars resolve without a request.
const BASE_SCHEDULE = {
  author: 'doug',
  createdAt: '2024-01-01T09:00:00.000Z',
  dataset: 'mock-data-set',
  description: '',
  name: 'schedule',
  projectId: 'mock-project-id',
  stateReason: '',
} satisfies Partial<Schedule>

// Everything lives in January 2024 so neither "today" nor the current month reaches the archive.
const SCHEDULES: Schedule[] = [
  {
    ...BASE_SCHEDULE,
    action: 'publish',
    documents: [{documentId: 'article-1', documentType: 'article'}],
    executeAt: '2024-01-15T10:00:00.000Z',
    id: 'publish-1',
    state: 'scheduled',
  },
  {
    ...BASE_SCHEDULE,
    action: 'unpublish',
    documents: [{documentId: 'article-2', documentType: 'article'}],
    executeAt: '2024-01-15T18:30:00.000Z',
    id: 'unpublish-1',
    state: 'scheduled',
  },
  {
    ...BASE_SCHEDULE,
    action: 'publish',
    documents: [{documentId: 'article-3', documentType: 'article'}],
    executeAt: '2024-01-08T09:00:00.000Z',
    executedAt: '2024-01-08T09:00:05.000Z',
    id: 'publish-2',
    state: 'succeeded',
  },
  {
    ...BASE_SCHEDULE,
    action: 'publish',
    documents: [{documentId: 'article-4', documentType: 'article'}],
    executeAt: '2024-01-03T12:00:00.000Z',
    id: 'publish-3',
    state: 'cancelled',
    stateReason: 'The document has validation errors',
  },
]

// What the preview store's batched field query finds for the scheduled documents, under either id.
const PREVIEW_DOCUMENTS = [
  {_id: 'article-1', _type: 'article', title: 'Launch announcement'},
  {_id: 'article-2', _type: 'article', title: 'Spring campaign'},
  {_id: 'article-3', _type: 'article', title: 'Quarterly report'},
  {_id: 'article-4', _type: 'article', title: 'Holiday newsletter'},
].flatMap((doc) => [doc, {...doc, _id: `drafts.${doc._id}`}])

// `usePollSchedules` reads this endpoint through the workspace client (project and dataset of the mock).
const SCHEDULES_URL = '/schedules/mock-project-id/mock-data-set'

const ENABLED: ScheduledPublishingEnabledContextValue = {
  enabled: true,
  mode: 'default',
  hasUsedScheduledPublishing: {used: true, loading: false},
}

// The route tree the scheduled publishing plugin registers for its tool.
const toolRouter = route.create('/', [
  route.intents('/intent'),
  route.create('/state/:state'),
  route.create('/date/:date'),
])

// A fresh SWR cache per mounted tree keeps the tools from sharing each other's responses.
const swrProvider = () => new Map()

const noop = () => {}

function createClient(): SanityClient {
  const client = createMockSanityClient({
    requests: {[SCHEDULES_URL]: {schedules: SCHEDULES}},
  })
  // The preview store reads fields through one GROQ query per selection (`[...][0...N]`) and
  // expects an array of matches per selection, while the mock resolves every `fetch` with `null`.
  // Every other query (releases, variants) keeps the mock's answer.
  const {fetch} = client.observable
  client.observable.fetch = (query: string, params?: unknown, options?: {tag?: string}) => {
    if (options?.tag !== 'preview.document-paths') return fetch(query, params)
    const selections = Number(/\[0\.\.\.(\d+)\]$/.exec(query)?.[1] ?? 1)
    return of(Array.from({length: selections}, () => PREVIEW_DOCUMENTS))
  }
  return client as unknown as SanityClient
}

function ToolHarness({initialState}: {initialState: RouterState}) {
  const [client] = useState(createClient)
  const [state, setState] = useState(initialState)
  const handleNavigate = useCallback(({path}: {path: string}) => {
    setState(toolRouter.decode(path) ?? {})
  }, [])

  return (
    <TestWrapper client={client} schemaTypes={SCHEMA_TYPES}>
      {/* `TestWrapper` mounts no locale provider, and the calendar's week layout reads the locale. */}
      <LocaleProvider>
        <SWRConfig value={{provider: swrProvider}}>
          <ScheduledPublishingEnabledContext.Provider value={ENABLED}>
            <RouterProvider router={toolRouter} state={state} onNavigate={handleNavigate}>
              {/* The studio gives the tool the full viewport height; the virtualized list needs one. */}
              <div data-testid="tool" style={{height: 720}}>
                <Tool />
              </div>
            </RouterProvider>
          </ScheduledPublishingEnabledContext.Provider>
        </SWRConfig>
      </LocaleProvider>
    </TestWrapper>
  )
}

function ToolPartsHarness() {
  const [client] = useState(createClient)

  return (
    <TestWrapper client={client} schemaTypes={SCHEMA_TYPES}>
      <ScheduledPublishingEnabledContext.Provider value={ENABLED}>
        <RouterProvider router={toolRouter} state={{state: 'succeeded'}} onNavigate={noop}>
          <SchedulesProvider value={{schedules: SCHEDULES, scheduleState: 'succeeded'}}>
            <VStack gap={5} data-testid="tool-parts">
              <Flex gap={2}>
                {SCHEDULE_FILTERS.map((filter) => (
                  <ScheduleFilter
                    key={filter}
                    schedules={SCHEDULES}
                    selected={filter === 'succeeded'}
                    state={filter}
                  />
                ))}
              </Flex>
              <Flex gap={1} data-testid="calendar-days">
                <CalendarDay
                  date={new Date(2024, 0, 14)}
                  isCurrentMonth
                  isToday={false}
                  onSelect={noop}
                />
                <CalendarDay
                  date={new Date(2024, 0, 15)}
                  isCurrentMonth
                  isToday={false}
                  onSelect={noop}
                />
                <CalendarDay
                  date={new Date(2024, 0, 8)}
                  isCurrentMonth
                  isToday={false}
                  onSelect={noop}
                  selected
                />
                <CalendarDay
                  date={new Date(2024, 0, 3)}
                  focused
                  isCurrentMonth
                  isToday={false}
                  onSelect={noop}
                />
                <CalendarDay
                  date={new Date(2024, 1, 1)}
                  isCurrentMonth={false}
                  isToday={false}
                  onSelect={noop}
                />
              </Flex>
              <Schedules />
            </VStack>
          </SchedulesProvider>
        </RouterProvider>
      </ScheduledPublishingEnabledContext.Provider>
    </TestWrapper>
  )
}

describe('Scheduled publishing tool', () => {
  test('filters the schedules by the routed date and then by state', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ToolHarness initialState={{date: '2024-01-15'}} />)

    const tool = page.getByTestId('tool')
    const dateFilter = tool.getByRole('button', {name: '15 January 2024'})
    await expect.element(dateFilter).toBeVisible()
    await expect.element(tool.getByText('Launch announcement')).toBeVisible()
    await expect.element(tool.getByText('Spring campaign')).toBeVisible()
    await expect.element(tool.getByText('Quarterly report')).not.toBeInTheDocument()
    await expect
      .element(tool.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .toHaveAttribute('aria-pressed', 'true')

    // Clearing the date falls back to the first state filter.
    await dateFilter.click()
    await expect.element(tool.getByRole('link', {name: /^Upcoming/})).toBeVisible()
    await expect.element(tool.getByText('Spring campaign')).toBeVisible()

    await tool.getByRole('link', {name: /^Failed/}).click()
    await expect.element(tool.getByText('Holiday newsletter')).toBeVisible()
    await expect.element(tool.getByText('Spring campaign')).not.toBeInTheDocument()
    await expect
      .element(tool.getByRole('button', {name: 'Mon Jan 15 2024'}))
      .not.toHaveAttribute('aria-pressed')

    await settleChromaticEndState()
  })

  test('renders the state filters, calendar days with pips and the completed list', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ToolPartsHarness />)

    const parts = page.getByTestId('tool-parts')
    await expect.element(parts.getByRole('link', {name: 'Upcoming 2'})).toBeVisible()
    await expect.element(parts.getByRole('link', {name: 'Completed 1'})).toBeVisible()
    await expect.element(parts.getByRole('link', {name: 'Failed 1'})).toBeVisible()
    await expect.element(parts.getByText('Quarterly report')).toBeVisible()
    await expect
      .element(parts.getByRole('button', {name: 'Clear all completed schedules'}))
      .toBeEnabled()

    const days = page.getByTestId('calendar-days')
    await expect
      .element(days.getByRole('button', {name: 'Mon Jan 08 2024'}))
      .toHaveAttribute('aria-pressed', 'true')
    await expect
      .element(days.getByRole('button', {name: 'Wed Jan 03 2024'}))
      .toHaveAttribute('data-focused', 'true')

    // A day with schedules lists them by state in its tooltip.
    await userEvent.hover(days.getByRole('button', {name: 'Mon Jan 15 2024'}))
    await expect.element(page.getByText('15 January 2024')).toBeVisible()
    await expect.element(page.getByText('10:00 AM')).toBeVisible()
    await expect.element(page.getByText('6:30 PM')).toBeVisible()
    await takeSnapshot('calendar-day-tooltip')

    await settleChromaticEndState()
  })
})
