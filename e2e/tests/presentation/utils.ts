import {expect, type Page} from '@playwright/test'

export async function openPresentationTool(page: Page): Promise<void> {
  await page.goto('/presentation')
  // Wait for presentation to be visible
  await expect(page.getByTestId('presentation-root')).toBeVisible()
}

export async function getPresentationRegions(page: Page) {
  const root = page.getByTestId('presentation-root')
  const previewIframe = root.locator('iframe')
  await expect(previewIframe).toBeVisible()
  await expect(previewIframe.first()).toBeVisible()
  const previewIframeContents = previewIframe.first().contentFrame()
  return {root, previewIframe, previewIframeContents}
}
