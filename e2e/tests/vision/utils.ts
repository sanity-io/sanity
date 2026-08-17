import {expect, type Page} from '@playwright/test'
import {type SanityClient} from '@sanity/client'

const VARIANTS_API_VERSION = 'X'

function getVariantsClient(sanityClient: SanityClient): SanityClient {
  return sanityClient.withConfig({apiVersion: VARIANTS_API_VERSION})
}

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
  const {queryEditor, paramsEditor, resultRegion} = await getVisionRegions(page)

  await queryEditor.click()
  await queryEditor.fill(query)
  await expect(queryEditor).toHaveText(query)

  const paramsInputText = JSON.stringify(params)
  await paramsEditor.fill(paramsInputText)
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

export async function createVariantDefinition(
  sanityClient: SanityClient,
  options: {
    variantId: string
    conditions?: Record<string, string>
    metadata?: {title?: string; [key: string]: unknown}
  },
): Promise<void> {
  // Variant definition actions are available at runtime, but their payloads are
  // not yet typed on SanityClient.action().
  await getVariantsClient(sanityClient).action({
    actionType: 'sanity.action.variant.definition.create',
    variantId: options.variantId,
    conditions: options.conditions ?? {},
    priority: 0,
    metadata: options.metadata,
  } as never)
}

export async function createVariantDocument(
  sanityClient: SanityClient,
  options: {
    variantId: string
    publishedId: string
    document: {_type: string; title: string}
  },
): Promise<void> {
  await getVariantsClient(sanityClient).action({
    actionType: 'sanity.action.document.variant.create',
    variantId: options.variantId,
    publishedId: options.publishedId,
    document: options.document,
  } as never)
}

export async function deleteVariantDefinition(
  sanityClient: SanityClient,
  variantId: string,
): Promise<void> {
  try {
    await getVariantsClient(sanityClient).action({
      actionType: 'sanity.action.variant.definition.delete',
      variantId,
    } as never)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('was not found')) {
      throw error
    }
  }
}
