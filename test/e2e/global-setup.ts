/* eslint-disable no-process-env */
import path from 'path'
import {chromium, FullConfig} from '@playwright/test'
import {loadEnvFiles} from '../../scripts/utils/loadEnvFiles'

loadEnvFiles()

/**
 * This setup will reuse the authentication state in new browser contexts so that you
 * are logged in for all tests
 */
async function globalSetup(config: FullConfig): Promise<void> {
  const {baseURL} = config.projects[0].use
  const browser = await chromium.launch()
  // Create context to store our session token cookie in
  const context = await browser.newContext()
  const page = await context.newPage()
  const token = process.env.SANITY_E2E_SESSION_TOKEN

  if (!token) {
    throw new Error('Missing sanity token - see README.md for details')
  }

  const [response] = await Promise.all([
    // CI is slow to start, make sure we wait long enough
    page.waitForResponse('*/**/users/me*', {timeout: 120000}),
    // This action triggers the request
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    page.goto(baseURL!),
  ])

  const domain = new URL(response.url()).hostname

  // Add the cookie to our context
  await context.addCookies([
    {
      name: 'sanitySession',
      value: token,
      sameSite: 'None',
      secure: true,
      httpOnly: true,
      domain: `.${domain}`,
      path: '/',
    },
  ])
  // Store the context in a file that will be reused across our tests
  await context.storageState({path: path.join(__dirname, 'state', 'storageState.json')})
  await browser.close()
}

export default globalSetup
