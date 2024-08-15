import {type SanityClient, type SanityDocumentStub} from '@sanity/client'
import {type Browser, type BrowserContext, type Page} from 'playwright'

export interface EfpsTestRunnerContext {
  page: Page
  context: BrowserContext
  browser: Browser
  client: SanityClient
}

export interface EfpsTest {
  name: string
  configPath: string | undefined
  document: SanityDocumentStub | ((context: EfpsTestRunnerContext) => Promise<SanityDocumentStub>)
  run: (context: EfpsTestRunnerContext) => Promise<EfpsTestResult>
}

export interface EfpsResult {
  label?: string
  p50: number
  p75: number
  p90: number
  latencies: number[]
}

export type EfpsTestResult = EfpsResult | EfpsResult[]

export function defineEfpsTest(config: EfpsTest): EfpsTest {
  return config
}
