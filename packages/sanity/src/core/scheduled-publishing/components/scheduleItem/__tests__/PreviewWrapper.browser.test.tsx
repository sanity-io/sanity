import {Text} from '@sanity/ui'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {SanityDefaultPreview} from '../../../../preview/components/SanityDefaultPreview'
import {type Schedule} from '../../../types'
import DateWithTooltip from '../dateWithTooltip/DateWithTooltip'
import DateWithTooltipElementQuery from '../dateWithTooltip/DateWithTooltipElementQuery'
import PreviewWrapper from '../PreviewWrapper'

// `doug` is the mock workspace's current user, so the avatar resolves without a request.
const BASE_SCHEDULE: Omit<Schedule, 'id' | 'state' | 'action' | 'executeAt'> = {
  author: 'doug',
  createdAt: '2024-01-01T09:00:00.000Z',
  dataset: 'mock-data-set',
  description: '',
  documents: [{documentId: 'article-1'}],
  name: 'schedule',
  projectId: 'mock-project-id',
  stateReason: '',
}

const UPCOMING_PUBLISH: Schedule = {
  ...BASE_SCHEDULE,
  id: 'upcoming-publish',
  action: 'publish',
  executeAt: '2024-01-15T10:00:00.000Z',
  state: 'scheduled',
}

const UPCOMING_UNPUBLISH: Schedule = {
  ...BASE_SCHEDULE,
  id: 'upcoming-unpublish',
  action: 'unpublish',
  executeAt: '2024-01-20T18:30:00.000Z',
  state: 'scheduled',
}

const COMPLETED: Schedule = {
  ...BASE_SCHEDULE,
  id: 'completed',
  action: 'publish',
  executeAt: '2024-01-12T10:00:00.000Z',
  executedAt: '2024-01-10T08:15:00.000Z',
  state: 'succeeded',
}

const FAILED: Schedule = {
  ...BASE_SCHEDULE,
  id: 'failed',
  action: 'publish',
  executeAt: '2024-01-05T10:00:00.000Z',
  state: 'cancelled',
  stateReason: 'The document was deleted before the schedule ran.',
}

const NO_DATE: Schedule = {
  ...BASE_SCHEDULE,
  id: 'no-date',
  action: 'publish',
  executeAt: null,
  state: 'scheduled',
}

const ENABLED: ScheduledPublishingEnabledContextValue = {
  enabled: true,
  mode: 'default',
  hasUsedScheduledPublishing: {used: true, loading: false},
}

const TOOLTIP_DATE = new Date('2024-01-15T10:00:00.000Z')

function PreviewWrapperHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ScheduledPublishingEnabledContext.Provider value={ENABLED}>
        <VStack gap={2} data-testid="schedule-previews">
          <PreviewWrapper
            contextMenu={<Button mode="bleed" text="Actions" />}
            schedule={UPCOMING_PUBLISH}
          >
            <SanityDefaultPreview title="Upcoming publish" subtitle="Article" />
          </PreviewWrapper>
          <PreviewWrapper schedule={UPCOMING_UNPUBLISH}>
            <SanityDefaultPreview title="Upcoming unpublish" subtitle="Article" />
          </PreviewWrapper>
          <PreviewWrapper schedule={COMPLETED}>
            <SanityDefaultPreview title="Completed" subtitle="Article" />
          </PreviewWrapper>
          <PreviewWrapper schedule={FAILED}>
            <SanityDefaultPreview title="Failed" subtitle="Article" />
          </PreviewWrapper>
          <PreviewWrapper schedule={NO_DATE} />
        </VStack>
      </ScheduledPublishingEnabledContext.Provider>
    </TestWrapper>
  )
}

function DateWithTooltipHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            Single format
          </Text>
          <div data-testid="date-plain">
            <DateWithTooltip date={TOOLTIP_DATE} />
          </div>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium">
            Element queries (narrow / medium / wide)
          </Text>
          <div data-testid="date-narrow" style={{width: 300}}>
            <DateWithTooltipElementQuery>
              <DateWithTooltip date={TOOLTIP_DATE} useElementQueries />
            </DateWithTooltipElementQuery>
          </div>
          <div data-testid="date-medium" style={{width: 700}}>
            <DateWithTooltipElementQuery>
              <DateWithTooltip date={TOOLTIP_DATE} useElementQueries />
            </DateWithTooltipElementQuery>
          </div>
          <div data-testid="date-wide" style={{width: 1000}}>
            <DateWithTooltipElementQuery>
              <DateWithTooltip date={TOOLTIP_DATE} useElementQueries />
            </DateWithTooltipElementQuery>
          </div>
        </VStack>
      </VStack>
    </TestWrapper>
  )
}

describe('scheduled publishing PreviewWrapper', () => {
  test('renders upcoming, completed, failed and undated schedules', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<PreviewWrapperHarness />)

    const previews = page.getByTestId('schedule-previews')
    await expect.element(previews.getByText('Upcoming publish')).toBeVisible()
    await expect.element(previews.getByText('unpublish', {exact: true})).toBeVisible()
    // The date column is rendered twice (one copy per breakpoint); the wide one is visible.
    await expect.element(previews.getByText('No date specified').last()).toBeVisible()
    await expect.element(previews.getByRole('button', {name: 'Actions'})).toBeVisible()
    // The completed schedule shows the date it actually ran, not the date it was scheduled for.
    await expect.element(previews.getByText('10 January 2024', {exact: false})).toBeVisible()

    await settleChromaticEndState()
  })
})

// Every `DateWithTooltip` in the harness renders the same date, so query the DOM instead of
// locators (which would resolve to several, mostly hidden, copies).
const visibleTooltipTexts = () =>
  Array.from(document.querySelectorAll<HTMLElement>('[data-ui="Tooltip"]'))
    .filter((el) => el.checkVisibility())
    .map((el) => el.textContent)

const visibleDateFormats = (testId: string) =>
  Array.from(
    document.querySelectorAll<HTMLElement>(`[data-testid="${testId}"] span[class^="date-"]`),
  )
    .filter((el) => el.checkVisibility())
    .map((el) => el.className)

describe('scheduled publishing DateWithTooltip', () => {
  test('shows the relative distance on hover and picks the format by container width', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<DateWithTooltipHarness />)

    const plain = page.getByTestId('date-plain')
    await expect.element(plain.getByText('Monday, 15 January 2024', {exact: false})).toBeVisible()

    // `ElementQuery` reports its breakpoints (the theme's 600px and 900px media steps) from a
    // ResizeObserver, hence the polling.
    await expect.poll(() => visibleDateFormats('date-narrow')).toEqual(['date-small'])
    await expect.poll(() => visibleDateFormats('date-medium')).toEqual(['date-medium'])
    await expect.poll(() => visibleDateFormats('date-wide')).toEqual(['date-large'])

    await userEvent.hover(plain.getByText('Monday, 15 January 2024', {exact: false}))
    await expect.poll(visibleTooltipTexts).toEqual([expect.stringMatching(/ago$/)])

    await settleChromaticEndState()
  })
})
