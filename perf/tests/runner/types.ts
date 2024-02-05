import {Page} from '@playwright/test'
import {SanityClient} from '@sanity/client'
import {ValidTestId} from './utils/testIds'

export interface Deployment {
  _id: string
  deploymentId: string
  url: string
  label: string
}
export interface PerformanceTestContext {
  page: Page
  url: string
  client: SanityClient
}

export interface PerformanceTestProps<
  Metrics extends {[name: string]: number} = {[name: string]: number},
  SetupData = undefined,
> {
  id: ValidTestId
  name: string
  version: number
  description: string
  setup?: (context: PerformanceTestContext) => SetupData extends undefined
    ? Promise<{data?: undefined; teardown: () => Promise<unknown> | void}>
    : Promise<{
        data: SetupData
        teardown: false | (() => Promise<unknown> | void)
      }>
  metrics: {[P in keyof Metrics]: MetricInfo}
  run: (context: PerformanceTestContext & {setupData: SetupData}) => Promise<Metrics>
}

type Unit = 'ms'

type MetricInfo = {
  title: string
  description: string
  unit: Unit
}
