import * as cp from 'child_process'
import * as BrowserStackLocal from 'browserstack-local'

interface BrowserLocalArguments {
  key: string
}

const clientPlaywrightVersion: string = cp
  .execSync('npx playwright --version')
  .toString()
  .trim()
  .split(' ')[1]

/* eslint-disable camelcase */
interface Capabilities {
  browser: string
  browser_version?: string
  os: string
  os_version: string
  name: string
  build: string
  'browserstack.username': string
  'browserstack.accessKey': string
  'browserstack.local': string | boolean
  'client.playwrightVersion': string
}

const caps: Capabilities = {
  browser: 'chrome',
  os: 'osx',
  os_version: 'catalina',
  name: 'Sanity E2E component tests',
  build: 'sanity-e2e-components-benchmark-3',
  'browserstack.username': process.env.BROWSERSTACK_USERNAME || '',
  'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY || '',
  'browserstack.local': process.env.BROWSERSTACK_LOCAL || true,
  'client.playwrightVersion': clientPlaywrightVersion,
}

export const bsLocal: BrowserStackLocal.Local = new BrowserStackLocal.Local()

export const BS_LOCAL_ARGS: BrowserLocalArguments = {
  key: process.env.BROWSERSTACK_ACCESS_KEY || '',
}

// Patching the capabilities dynamically according to the project name.
const patchCaps = (name: string, title: string): void => {
  const combination = name.split(/@browserstack/)[0]
  const [browerCaps, osCaps] = combination.split(/:/)
  const [browser, browser_version] = browerCaps.split(/@/)
  const osCapsSplit = osCaps.split(/ /)
  const os = osCapsSplit.shift()
  const os_version = osCapsSplit.join(' ')
  caps.browser = browser ? browser : 'chrome'
  caps.browser_version = browser_version ? browser_version : 'latest'
  caps.os = os ? os : 'osx'
  caps.os_version = os_version ? os_version : 'catalina'
  caps.name = title
}

/* eslint-enable camelcase */

/**
 * @description This generates the CDP endpoint for the given browser/os version.
 * @link https://www.browserstack.com/docs/automate/playwright/browsers-and-os
 * @param {string} name - The name of the test.
 * @param {string} title - The title of the test.
 * @returns {string} cdpUrl - The CDP endpoint for the given test.
 */
export const getCdpEndpoint = (name: string, title: string): string => {
  patchCaps(name, title)
  const cdpUrl = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
    JSON.stringify(caps)
  )}`
  return cdpUrl
}
