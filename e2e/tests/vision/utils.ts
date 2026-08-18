import {expect, type Page} from '@playwright/test'
import {type SanityClient} from '@sanity/client'

import {getVariantsClient} from '../variants/utils'

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

export const openVisionTool = async (page: Page, search = '') => {
  await page.goto(`/vision${search}`)
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

export const runVisionQuery = async (
  page: Page,
  query: string,
  params: Record<string, unknown>,
) => {
  const {queryEditor, paramsEditor, paramsRegion, resultRegion} = await getVisionRegions(page)

  await queryEditor.click()
  await queryEditor.fill(query)
  await expect(queryEditor).toHaveText(query)

  const paramsInputText = JSON.stringify(params)
  // Fill incomplete JSON first so the params error icon is forced on, then
  // complete it. `toHaveText` on CodeMirror does not mean Vision has parsed
  // `$id` yet — fetching immediately races that and the API returns
  // "param $id referenced, but not provided".
  await paramsEditor.fill(paramsInputText.slice(0, -2))
  await expect(paramsRegion.locator('[data-sanity-icon="error-outline"]')).toBeVisible()
  await paramsEditor.fill(paramsInputText)
  await expect(paramsRegion.locator('[data-sanity-icon="error-outline"]')).not.toBeVisible()
  await expect(paramsEditor).toHaveText(paramsInputText)

  const fetchButton = page.locator('button').filter({hasText: 'Fetch'})
  await expect(fetchButton).toBeVisible()
  await expect(fetchButton).toBeEnabled()
  await fetchButton.click()

  return resultRegion
}

export const getVisionRegions = async (page: Page) => {
  const queryEditorRegion = page.getByTestId('vision-query-editor')
  const queryEditor = queryEditorRegion.locator('.cm-content')
  const paramsRegion = page.getByTestId('params-editor')
  const paramsEditor = paramsRegion.locator('.cm-content')
  const resultRegion = page.getByTestId('vision-result')
  return {queryEditorRegion, queryEditor, paramsRegion, paramsEditor, resultRegion}
}

export async function fetchVariantDocumentByTitle(
  sanityClient: SanityClient,
  options: {variantId: string; title: string},
): Promise<string | undefined> {
  // Variant overlay remaps `_id` in some results, but GROQ filters on `_id`
  // (and even a JS check for the remapped published id) miss documents whose
  // overlay `_id` is still `versions.<scope>.<publishedId>`. The title is unique
  // per test, so match that across the perspectives the create action may land
  // in. Project `title` only — projecting `_id` has made overlay hits disappear.
  const client = getVariantsClient(sanityClient)
  const params = {title: options.title}
  const query = '*[title == $title]{title}'

  for (const perspective of ['raw', 'published', 'drafts'] as const) {
    const result = await client
      .withConfig({perspective, variant: options.variantId})
      .fetch<Array<{title?: string}>>(query, params)
    const match = result.find((doc) => doc.title === options.title)
    if (match?.title) {
      return match.title
    }
  }

  return undefined
}
