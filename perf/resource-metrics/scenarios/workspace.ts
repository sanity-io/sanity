import {type Scenario} from '../types'

/** Boots a workspace by navigating to its basePath and waiting for the navbar */
export const workspaceBoot: Scenario = {
  name: 'workspace-boot',
  description: 'Navigate to a workspace and wait for the Studio UI to be ready',
  getUrl(baseUrl: string, basePath: string) {
    return `${baseUrl}${basePath}`
  },
  async waitForReady(page) {
    await page.locator('[data-ui="Navbar"]').waitFor({state: 'visible', timeout: 60_000})
  },
}
