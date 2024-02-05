import {createSanitySessionCookie} from './runner/utils/createSanitySessionCookie'
import {STUDIO_PROJECT_ID} from './config/constants'
import {readEnv} from './config/envVars'

const {chromium} = require('@playwright/test')

async function run({projectId, token, url}: {projectId: string; token: string; url: string}) {
  // Make sure to run headed.
  const browser = await chromium.launch({headless: false})
  // Setup context however you like.
  const context = await browser.newContext()
  await context.addCookies([createSanitySessionCookie(projectId, token)])

  // Pause the page, and start recording manually.
  const page = await context.newPage()
  await page.goto(url)

  // So this looks like an internal API, so can be removed if it starts failing. Recording can still be enabled manually from the UI
  await context._enableRecorder({mode: 'recording'})

  await page.pause()
}

run({
  projectId: STUDIO_PROJECT_ID,
  token: readEnv('PERF_TEST_SANITY_TOKEN'),
  url: 'http://localhost:3300',
})
