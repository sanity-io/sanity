import {type SanityClient} from '@sanity/client'
import {type ValidationMarker} from '@sanity/types'
import {Text} from '@sanity/ui'
import {useState} from 'react'
import {
  ScheduledPublishingEnabledContext,
  type ScheduledPublishingEnabledContextValue,
} from 'sanity/_singletons'
import {SWRConfig} from 'swr'
import {VStack} from 'ui5'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {type Schedule} from '../../../types'
import {ScheduleBanner} from '../ScheduleBanner'

const SCHEDULES: Schedule[] = [
  {
    author: 'doug',
    action: 'publish',
    createdAt: '2024-01-01T09:00:00.000Z',
    dataset: 'mock-data-set',
    description: '',
    documents: [{documentId: 'article-1', documentType: 'article'}],
    executeAt: '2024-01-15T10:00:00.000Z',
    id: 'publish-1',
    name: 'schedule',
    projectId: 'mock-project-id',
    state: 'scheduled',
    stateReason: '',
  },
  {
    author: 'doug',
    action: 'unpublish',
    createdAt: '2024-01-01T09:00:00.000Z',
    dataset: 'mock-data-set',
    description: '',
    documents: [{documentId: 'article-1', documentType: 'article'}],
    executeAt: '2024-01-20T18:30:00.000Z',
    id: 'unpublish-1',
    name: 'schedule',
    projectId: 'mock-project-id',
    state: 'scheduled',
    stateReason: '',
  },
]

// `usePollSchedules` reads this endpoint through the workspace client (project and dataset of the mock).
const SCHEDULES_URL = '/schedules/mock-project-id/mock-data-set'

const ERROR_MARKERS: ValidationMarker[] = [
  {level: 'error', message: 'Title is required', path: ['title']},
]

const DEFAULT_MODE: ScheduledPublishingEnabledContextValue = {
  enabled: true,
  mode: 'default',
  hasUsedScheduledPublishing: {used: true, loading: false},
}

const UPSELL_MODE: ScheduledPublishingEnabledContextValue = {
  ...DEFAULT_MODE,
  mode: 'upsell',
}

// A fresh SWR cache per mounted tree keeps the banners from sharing (and revalidating) each
// other's responses across tests.
const swrProvider = () => new Map()

function ScheduleBannerHarness() {
  const [client] = useState(
    () =>
      createMockSanityClient({
        requests: {[SCHEDULES_URL]: {schedules: SCHEDULES}},
      }) as unknown as SanityClient,
  )

  return (
    <TestWrapper client={client} schemaTypes={[]}>
      <SWRConfig value={{provider: swrProvider}}>
        <VStack gap={4} data-testid="schedule-banners">
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              Upcoming schedules
            </Text>
            <div data-testid="banner-default">
              <ScheduledPublishingEnabledContext.Provider value={DEFAULT_MODE}>
                <ScheduleBanner id="article-1" markers={[]} />
              </ScheduledPublishingEnabledContext.Provider>
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              Document with validation errors
            </Text>
            <div data-testid="banner-errors">
              <ScheduledPublishingEnabledContext.Provider value={DEFAULT_MODE}>
                <ScheduleBanner id="drafts.article-1" markers={ERROR_MARKERS} />
              </ScheduledPublishingEnabledContext.Provider>
            </div>
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium">
              Plan without scheduled publishing
            </Text>
            <div data-testid="banner-upsell">
              <ScheduledPublishingEnabledContext.Provider value={UPSELL_MODE}>
                <ScheduleBanner id="article-1" markers={[]} />
              </ScheduledPublishingEnabledContext.Provider>
            </div>
          </VStack>
        </VStack>
      </SWRConfig>
    </TestWrapper>
  )
}

describe('scheduled publishing ScheduleBanner', () => {
  test('lists the upcoming schedules of the document in default, error and upsell modes', async () => {
    const {settleChromaticEndState} = testHelpers()
    void render(<ScheduleBannerHarness />)

    const defaultBanner = page.getByTestId('banner-default')
    await expect.element(defaultBanner.getByText('Upcoming schedule')).toBeVisible()
    await expect
      .element(defaultBanner.getByText('Monday, 15 January 2024', {exact: false}))
      .toBeVisible()
    await expect
      .element(defaultBanner.getByText('Saturday, 20 January 2024', {exact: false}))
      .toBeVisible()
    await expect.element(defaultBanner.getByText('unpublish', {exact: true})).toBeVisible()

    await expect
      .element(page.getByTestId('banner-errors').getByText('validation errors', {exact: false}))
      .toBeVisible()

    await expect
      .element(
        page
          .getByTestId('banner-upsell')
          .getByText('Scheduled publishing is not available on your current plan'),
      )
      .toBeVisible()

    await settleChromaticEndState()
  })
})
