import {type SanityClient, type SanityDocument, type SanityDocumentStub} from '@sanity/client'
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
  run: (context: EfpsTestRunnerContext & {document: SanityDocument}) => Promise<EfpsResult[]>
}

export interface EfpsResult {
  label: string
  runDuration: number
  blockingTime: number
  latency: {
    median: number
    error: number
    p75: number
    p90: number
    p99: number
  }
}

export interface EfpsAbResult {
  experiment: EfpsResult
  reference: EfpsResult
}

export function defineEfpsTest(config: EfpsTest): EfpsTest {
  return config
}
