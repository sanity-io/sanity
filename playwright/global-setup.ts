/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-process-env */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import {chromium, FullConfig} from '@playwright/test'

require('dotenv').config()

/**
 * This setup will reuse the authentication state in new browser contexts so that you
 * are logged in for all tests
 */

async function globalSetup(config: FullConfig) {
  const {baseURL} = config.projects[0].use
  const browser = await chromium.launch()
  // Create context to store our session token cookie in
  const context = await browser.newContext()
  const page = await context.newPage()
  const token = process.env.PLAYWRIGHT_SANITY_SESSION_TOKEN

  if (!token) {
    throw new Error('Missing sanity token')
  }

  const [response] = await Promise.all([
    page.waitForResponse('*/**/users/me*'),
    // This action triggers the request
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
