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

  // Vision is a code-split tool: the React tree renders `vision-root` before
  // the CodeMirror editors have finished lazy-loading. Tests that immediately
  // click or type into the query/params editors race against this async mount.
  // Wait for both CodeMirror content nodes to be attached and marked editable
  // (CodeMirror sets `contenteditable="true"` once the view is ready for input).
  const queryEditor = page.getByTestId('vision-query-editor').locator('.cm-content')
  const paramsEditor = page.getByTestId('params-editor').locator('.cm-content')

  await expect(queryEditor).toBeVisible()
  await expect(paramsEditor).toBeVisible()
  await expect(queryEditor).toHaveAttribute('contenteditable', 'true')
  await expect(paramsEditor).toHaveAttribute('contenteditable', 'true')
}

export const getVisionRegions = async (page: Page) => {
  const queryEditorRegion = page.getByTestId('vision-query-editor')
  const queryEditor = queryEditorRegion.locator('.cm-content')
  const paramsRegion = page.getByTestId('params-editor')
  const paramsEditor = paramsRegion.locator('.cm-content')
  const resultRegion = page.getByTestId('vision-result')
  return {queryEditorRegion, queryEditor, paramsRegion, paramsEditor, resultRegion}
}
