import {Page} from '@playwright/test'

interface PerformanceTestRunnerProps {
  page: Page
  path: string
  test: (options: any) => Promise<any>
  url: string
}

export const performanceTestRunner = async <T>(options: PerformanceTestRunnerProps): Promise<T> => {
  const {page, path, test, url} = options
  await page.goto(`${url}${path}`)

  const res = await test({page})

  return res
}
