import {Page} from '@playwright/test'
import {SanityClient} from '@sanity/client'
import {ValidTestId} from './utils/testIds'

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

type Unit = 'ms'

type MetricInfo = {
  title: string
  description: string
  unit: Unit
}
