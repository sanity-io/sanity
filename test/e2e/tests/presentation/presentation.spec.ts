import {expect} from '@playwright/test'
import {test} from '@sanity/test'

import {getPresentationRegions, openPresentationTool} from './utils'

test.describe('Presentation', () => {
  test('should be able to load a simple preview', async ({page}) => {
    await openPresentationTool(page)

    const {previewIframeContents} = await getPresentationRegions(page)

    // Checks that the preview iframe has loaded visual editing
    await expect(previewIframeContents.locator('sanity-visual-editing')).toBeAttached()
  })
})
