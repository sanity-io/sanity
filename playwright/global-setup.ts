import {chromium, FullConfig} from '@playwright/test'

require('dotenv').config()

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
  // eslint-disable-next-line no-process-env
  const token = process.env.PLAYWRIGHT_SANITY_SESSION_TOKEN

  if (!token) {
    throw new Error('Missing sanity token')
  }

  const [response] = await Promise.all([
    page.waitForResponse('*/**/users/me*'),
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
  await context.storageState({path: 'storageState.json'})
  await browser.close()
}

export default globalSetup
