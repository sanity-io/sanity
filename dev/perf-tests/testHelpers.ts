import type {Page} from 'puppeteer'
import puppeteer from 'puppeteer'

import {getEnv} from './utils/getEnv'

export type TestFunction =
  | ((baseUrl: string) => TestResult)
  | ((baseUrl: string) => Promise<TestResult>)

export interface TestResult {
  duration: number
}

export interface Test {
  name: string
  fn: TestFunction
}

type TestStudioOptions = {page: Page; baseUrl: string}
type TestStudioFunction =
  | ((options: TestStudioOptions) => TestResult)
  | ((options: TestStudioOptions) => Promise<TestResult>)

const userToken = getEnv('PERF_TEST_SANITY_SESSION_TOKEN')

export function studio(name: string, testFn: TestStudioFunction): Test {
  return {
    name,
    fn: async (baseUrl: string) => {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.setCookie({
        name: 'sanitySession',
        value: userToken,
        secure: true,
        httpOnly: true,
        sameSite: 'None',
        domain: `.ppsg7ml5.api.sanity.io`,
      })
      const result = await testFn({baseUrl, page})
      await browser.close()

      return result
    },
  }
}
