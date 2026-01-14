import {expect, type Page} from '@playwright/test'

export function encodeQueryString(
  query: string,
  params: Record<string, unknown> = {},
  options: Record<string, string | string[]> = {},
): string {
  const searchParams = new URLSearchParams()
  searchParams.set('query', query)

  for (const [key, value] of Object.entries(params)) {
    searchParams.set(`$${key}`, JSON.stringify(value))
  }

  for (const [key, value] of Object.entries(options)) {
    if (value) searchParams.set(key, `${value}`)
  }

  return `?${searchParams}`
}

export const openVisionTool = async (page: Page) => {
  await page.goto('/vision')
  // Wait for vision to be visible
  await expect(page.getByTestId('vision-root')).toBeVisible()
}

export const getVisionRegions = async (page: Page) => {
  const queryEditorRegion = page.getByTestId('vision-query-editor')
  const queryEditor = queryEditorRegion.locator('.cm-content')
  const paramsRegion = page.getByTestId('params-editor')
  const paramsEditor = paramsRegion.locator('.cm-content')
  const resultRegion = page.getByTestId('vision-result')
  return {queryEditorRegion, queryEditor, paramsRegion, paramsEditor, resultRegion}
}
