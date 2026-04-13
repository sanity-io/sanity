import {type Scenario} from '../types'

export const studioBoot: Scenario = {
  name: 'studio-boot',
  description: 'Boot the Studio and wait for the desk structure to be visible',
  getUrl(baseUrl: string) {
    return baseUrl
  },
  async waitForReady(page) {
    // Wait for the main navigation/desk structure to appear, indicating the Studio has fully loaded
    await page.locator('[data-ui="Navbar"]').waitFor({state: 'visible', timeout: 60_000})
  },
}
