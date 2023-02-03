import {Page} from '@playwright/test'
import {SanityClient} from '@sanity/client'

type TODO = any

// type Metric = 'memory' | 'fps' | 's'
type PerformanceSummary = {result: number}

export interface PerformanceTestContext {
  page: Page
  url: string
  client: SanityClient
}
export interface PerformanceTestProps {
  name: string
  setup?: () => () => void
  run: (context: PerformanceTestContext) => Promise<PerformanceSummary>
}
