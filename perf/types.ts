import {Page} from '@playwright/test'
import {SanityClient} from '@sanity/client'
import {ValidTestId} from './utils/testIds'

// type Metric = 'memory' | 'fps' | 's'
type PerformanceSummary = {result: number}

export interface PerformanceTestContext {
  page: Page
  url: string
  client: SanityClient
}
export interface PerformanceTestProps {
  id: ValidTestId
  name: string
  description: string
  setup?: () => () => void
  run: (context: PerformanceTestContext) => Promise<PerformanceSummary>
}
