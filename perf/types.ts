import {Page} from '@playwright/test'
import {SanityClient} from '@sanity/client'
import {ValidTestId} from './utils/testIds'

// type Metric = 'memory' | 'fps' | 's'

export interface PerformanceTestContext {
  page: Page
  url: string
  client: SanityClient
}

export interface PerformanceTestProps<
  Metrics extends {[name: string]: number} = {[name: string]: number}
> {
  id: ValidTestId
  name: string
  version: number
  description: string
  setup?: () => () => void
  metrics: {[P in keyof Metrics]: MetricInfo}
  run: (context: PerformanceTestContext) => Promise<Metrics>
}

type MetricInfo = {
  name: string
  description: string
}
