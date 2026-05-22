import {expect, type Page, type TestInfo} from '@playwright/test'
import {type SanityClient} from '@sanity/client'

import {test} from '../../studio-test'

const VARIANT_DOCUMENTS_PATH = 'variants'
const VARIANT_DOCUMENT_TYPE = 'system.variant'

const E2E_VARIANT_TITLE_RUN_ID = `${Date.now().toString(36)}${Math.random()
  .toString(36)
  .slice(2, 10)}`

interface VariantDocument {
  _id: `${typeof VARIANT_DOCUMENTS_PATH}.${string}`
  _type: typeof VARIANT_DOCUMENT_TYPE
  conditions: Record<string, string>
  priority: number
  metadata?: {
    title?: string
    [key: string]: unknown
  }
}

function normalizeTitlePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function createVariantTitlePrefix(testInfo: TestInfo = test.info()): string {
  const projectName = normalizeTitlePart(testInfo.project.name)
  const testName = normalizeTitlePart(testInfo.title)

  return `E2E Variants ${E2E_VARIANT_TITLE_RUN_ID} ${projectName} worker ${testInfo.parallelIndex} retry ${testInfo.retry} ${testName}`
}

async function deleteVariantDocuments(
  sanityClient: SanityClient,
  titlePrefix: string,
): Promise<void> {
  await sanityClient.delete({
    query: `*[
      _type == $variantDocumentType &&
      _id in path("${VARIANT_DOCUMENTS_PATH}.*") &&
      metadata.title match $titleGlob
    ]`,
    params: {
      titleGlob: `${titlePrefix}*`,
      variantDocumentType: VARIANT_DOCUMENT_TYPE,
    },
  })
}

function createRunId(label: string): string {
  const {parallelIndex, project, retry} = test.info()
  const projectName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return `${label}-${projectName}-${parallelIndex}-${retry}-${E2E_VARIANT_TITLE_RUN_ID}`
}

function getVariantShortId(variantDocumentId: string): string {
  return variantDocumentId.startsWith(`${VARIANT_DOCUMENTS_PATH}.`)
    ? variantDocumentId.slice(`${VARIANT_DOCUMENTS_PATH}.`.length)
    : variantDocumentId
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function openVariantsTool(page: Page): Promise<void> {
  await page.goto('/variants')
  await expect(page.getByRole('heading', {name: 'Variants'})).toBeVisible()
}

async function openCreateVariantDialog(page: Page) {
  await page.getByRole('button', {name: 'Create variant'}).first().click()

  const dialog = page.getByRole('dialog', {name: 'Create variant'})
  await expect(dialog).toBeVisible()

  return dialog
}

function getConditionKeyInputs(pageOrDialog: Page | ReturnType<Page['getByRole']>) {
  return pageOrDialog.getByTestId('variant-form-condition-key')
}

function getConditionValueInputs(pageOrDialog: Page | ReturnType<Page['getByRole']>) {
  return pageOrDialog.getByTestId('variant-form-condition-value')
}

async function fillConditionRow(
  dialog: ReturnType<Page['getByRole']>,
  index: number,
  key: string,
  value: string,
): Promise<void> {
  await getConditionKeyInputs(dialog).nth(index).fill(key)
  await getConditionValueInputs(dialog).nth(index).fill(value)
}

async function findVariantDocumentByTitle(
  sanityClient: SanityClient,
  title: string,
): Promise<VariantDocument | null> {
  return sanityClient.fetch<VariantDocument | null>(
    `*[
      _type == "${VARIANT_DOCUMENT_TYPE}" &&
      _id in path("${VARIANT_DOCUMENTS_PATH}.*") &&
      metadata.title == $title
    ][0]{
      _id,
      _type,
      conditions,
      priority,
      metadata,
    }`,
    {title},
  )
}

async function waitForVariantDocument(
  sanityClient: SanityClient,
  title: string,
): Promise<VariantDocument> {
  let document: VariantDocument | null = null

  await expect
    .poll(
      async () => {
        document = await findVariantDocumentByTitle(sanityClient, title)

        return document?._id ?? null
      },
      {message: `variant document "${title}" should be persisted`},
    )
    .not.toBeNull()

  if (!document) {
    throw new Error(`Variant document "${title}" was not found`)
  }

  return document
}

async function submitCreateVariantDialog(
  page: Page,
  sanityClient: SanityClient,
  title: string,
): Promise<VariantDocument> {
  await expect(page.getByTestId('submit-variant-button')).toBeEnabled()
  await page.getByTestId('submit-variant-button').click()

  await expect(page).toHaveURL(/\/variants\/[^/?#]+$/)
  expect(new URL(page.url()).pathname).not.toContain('_.variants')

  const document = await waitForVariantDocument(sanityClient, title)

  const shortVariantId = getVariantShortId(document._id)
  expect(new URL(page.url()).pathname).toMatch(
    new RegExp(`/variants/${escapeRegExp(shortVariantId)}$`),
  )

  return document
}

function getVariantRow(page: Page, title: string) {
  return page.getByTestId('table-row').filter({hasText: title})
}

test.describe('Variants create flow', () => {
  test.afterEach(async ({sanityClient}, testInfo) => {
    await deleteVariantDocuments(sanityClient, createVariantTitlePrefix(testInfo))
  })

  test('creates a variant and persists conditions', async ({page, sanityClient}) => {
    const runId = createRunId('happy')
    const title = `${createVariantTitlePrefix()} Loyal Customers ${runId}`
    const value = `loyal-${runId}`

    await openVariantsTool(page)
    const dialog = await openCreateVariantDialog(page)

    await dialog.getByTestId('variant-form-title').fill(title)
    await fillConditionRow(dialog, 0, 'audience', value)

    const document = await submitCreateVariantDialog(page, sanityClient, title)

    expect(document._id).toMatch(new RegExp(`^${escapeRegExp(VARIANT_DOCUMENTS_PATH)}\\.`))
    expect(document._type).toBe(VARIANT_DOCUMENT_TYPE)
    expect(document.metadata?.title).toBe(title)
    expect(document.conditions).toEqual({audience: value})
  })

  test('validates title and complete condition rows', async ({page}) => {
    await openVariantsTool(page)
    const dialog = await openCreateVariantDialog(page)
    const submitButton = dialog.getByTestId('submit-variant-button')
    const addConditionButton = dialog.getByRole('button', {name: 'Add condition'})
    const titleInput = dialog.getByTestId('variant-form-title')

    await expect(submitButton).toBeDisabled()
    await expect(addConditionButton).toBeDisabled()

    await titleInput.focus()
    await titleInput.blur()
    await expect(dialog.getByTestId('variant-form-title-error')).toHaveText('Title is required')

    await titleInput.fill(`${createVariantTitlePrefix()} Validation ${createRunId('validation')}`)
    await expect(dialog.getByTestId('variant-form-title-error')).toBeHidden()

    await getConditionKeyInputs(dialog).first().fill('audience')
    await expect(submitButton).toBeDisabled()
    await expect(addConditionButton).toBeDisabled()

    await getConditionValueInputs(dialog).first().fill('loyal')
    await expect(submitButton).toBeEnabled()
    await expect(addConditionButton).toBeEnabled()

    await addConditionButton.click()
    await expect(getConditionKeyInputs(dialog)).toHaveCount(2)
    await expect(addConditionButton).toBeDisabled()
    await expect(submitButton).toBeDisabled()
  })

  test('keeps duplicate condition keys invalid until the edited key is unique', async ({
    page,
    sanityClient,
  }) => {
    const runId = createRunId('duplicate')
    const title = `${createVariantTitlePrefix()} Duplicate Keys ${runId}`

    await openVariantsTool(page)
    const dialog = await openCreateVariantDialog(page)

    await dialog.getByTestId('variant-form-title').fill(title)
    await fillConditionRow(dialog, 0, 'audience', 'us')
    await dialog.getByRole('button', {name: 'Add condition'}).click()

    const secondKeyInput = getConditionKeyInputs(dialog).nth(1)

    await secondKeyInput.fill('audience')
    await getConditionValueInputs(dialog).nth(1).fill('fr')
    await expect(dialog.getByTestId('variant-form-condition-key-error')).toHaveText(
      'Condition keys must be unique',
    )
    await expect(dialog.getByTestId('submit-variant-button')).toBeDisabled()

    await secondKeyInput.fill('audience2')
    await expect(secondKeyInput).toHaveValue('audience2')
    await expect(dialog.getByTestId('variant-form-condition-key-error')).toBeHidden()

    const document = await submitCreateVariantDialog(page, sanityClient, title)

    expect(document.conditions).toEqual({
      audience: 'us',
      audience2: 'fr',
    })
  })

  test('preserves partial condition key editing from new to newton', async ({
    page,
    sanityClient,
  }) => {
    const runId = createRunId('partial')
    const title = `${createVariantTitlePrefix()} Partial Key ${runId}`

    await openVariantsTool(page)
    const dialog = await openCreateVariantDialog(page)

    await dialog.getByTestId('variant-form-title').fill(title)
    await fillConditionRow(dialog, 0, 'new', 'us')
    await dialog.getByRole('button', {name: 'Add condition'}).click()

    const secondKeyInput = getConditionKeyInputs(dialog).nth(1)

    await secondKeyInput.type('new')
    await expect(secondKeyInput).toHaveValue('new')
    await expect(dialog.getByTestId('variant-form-condition-key-error')).toHaveText(
      'Condition keys must be unique',
    )

    await secondKeyInput.type('ton')
    await expect(secondKeyInput).toHaveValue('newton')
    await expect(dialog.getByTestId('variant-form-condition-key-error')).toBeHidden()

    await getConditionValueInputs(dialog).nth(1).fill('gb')
    await expect(dialog.getByTestId('submit-variant-button')).toBeEnabled()

    const document = await submitCreateVariantDialog(page, sanityClient, title)

    expect(document.conditions).toEqual({
      new: 'us',
      newton: 'gb',
    })
  })

  test('suggests condition keys and values from existing variants', async ({
    page,
    sanityClient,
  }) => {
    const runId = createRunId('autocomplete')
    const seededAudienceTitle = `${createVariantTitlePrefix()} Autocomplete Audience Seed ${runId}`
    const seededLanguageTitle = `${createVariantTitlePrefix()} Autocomplete Language Seed ${runId}`
    const title = `${createVariantTitlePrefix()} Autocomplete Created ${runId}`
    const audienceValue = `returning-${runId}`
    const languageValue = `en-${runId}`

    const seededAudienceVariant: VariantDocument = {
      _id: `${VARIANT_DOCUMENTS_PATH}.${runId}-audience` as const,
      _type: VARIANT_DOCUMENT_TYPE,
      conditions: {audience: audienceValue},
      metadata: {title: seededAudienceTitle},
      priority: 0,
    }
    const seededLanguageVariant: VariantDocument = {
      _id: `${VARIANT_DOCUMENTS_PATH}.${runId}-language` as const,
      _type: VARIANT_DOCUMENT_TYPE,
      conditions: {language: languageValue},
      metadata: {title: seededLanguageTitle},
      priority: 0,
    }

    await sanityClient.createOrReplace(seededAudienceVariant)
    await sanityClient.createOrReplace(seededLanguageVariant)

    await openVariantsTool(page)
    await expect(getVariantRow(page, seededAudienceTitle)).toBeVisible()
    await expect(getVariantRow(page, seededLanguageTitle)).toBeVisible()

    const dialog = await openCreateVariantDialog(page)

    await dialog.getByTestId('variant-form-title').fill(title)

    await getConditionKeyInputs(dialog).first().fill('aud')
    await page.getByRole('option', {name: 'audience', exact: true}).click()
    await expect(getConditionKeyInputs(dialog).first()).toHaveValue('audience')

    await getConditionValueInputs(dialog).first().fill('ret')
    await expect(page.getByRole('option', {name: audienceValue, exact: true})).toBeVisible()
    await expect(page.getByRole('option', {name: languageValue, exact: true})).toBeHidden()
    await page.getByRole('option', {name: audienceValue, exact: true}).click()

    const document = await submitCreateVariantDialog(page, sanityClient, title)

    expect(document.conditions).toEqual({audience: audienceValue})
  })

  test('deletes a seeded variant from the overview', async ({page, sanityClient}) => {
    const runId = createRunId('delete')
    const variantId = `${VARIANT_DOCUMENTS_PATH}.${runId}` as const
    const title = `${createVariantTitlePrefix()} Delete Variant ${runId}`
    const value = `delete-${runId}`

    const seededVariant: VariantDocument = {
      _id: variantId,
      _type: VARIANT_DOCUMENT_TYPE,
      conditions: {audience: value},
      metadata: {title},
      priority: 0,
    }

    await sanityClient.createOrReplace(seededVariant)

    await openVariantsTool(page)

    const row = getVariantRow(page, title)
    await expect(row).toBeVisible()

    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', {name: 'Delete variant'}).click()
    await expect(page.getByRole('menuitem', {name: 'Delete variant'})).toBeHidden()

    await expect(row).toBeHidden()
    await expect.poll(async () => sanityClient.getDocument(variantId)).toBeUndefined()
  })

  test('deletes a seeded variant from the detail page', async ({page, sanityClient}) => {
    const runId = createRunId('delete-detail')
    const variantId = `${VARIANT_DOCUMENTS_PATH}.${runId}` as const
    const shortVariantId = getVariantShortId(variantId)
    const title = `${createVariantTitlePrefix()} Delete Detail Variant ${runId}`
    const value = `delete-detail-${runId}`

    const seededVariant: VariantDocument = {
      _id: variantId,
      _type: VARIANT_DOCUMENT_TYPE,
      conditions: {audience: value},
      metadata: {title},
      priority: 0,
    }

    await sanityClient.createOrReplace(seededVariant)

    await page.goto(`/variants/${shortVariantId}`)
    await expect(page.getByRole('heading', {name: title})).toBeVisible()

    await page.locator(`#variant-detail-actions-${shortVariantId}`).click()
    await page.getByRole('menuitem', {name: 'Delete variant'}).click()
    await expect(page.getByRole('menuitem', {name: 'Delete variant'})).toBeHidden()

    await expect(page.getByRole('heading', {name: 'Variants'})).toBeVisible()
    await expect(getVariantRow(page, title)).toBeHidden()
    await expect.poll(async () => sanityClient.getDocument(variantId)).toBeUndefined()
  })
})
