import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`date input shows validation on selecting date from datepicker`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateValidation')

  await expect(await page.getByTestId(`field-requiredDate`)).toBeVisible()

  await page.getByTestId('field-requiredDate').getByTestId('select-date-button').click()
  await page.getByTestId('date-input-dialog').getByTestId('date-input').fill('2023')
  await page.getByTestId('date-input-dialog').getByTestId('date-input').press('Enter')
  await page.getByTestId('date-input-dialog').getByRole('combobox').selectOption('0')
  await page.getByLabel('Sun Jan 01 2023').click()

  await expect(
    page.getByTestId('field-requiredDate').getByTestId('input-validation-icon-error'),
  ).toBeVisible()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})

test.skip(`date input shows validation on entering date in the text field`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateValidation')

  await page.waitForSelector(`data-testid=field-requiredDate`)

  await page.getByTestId('field-requiredDate').getByTestId('date-input').fill('2023-01-01')

  await expect(
    page.getByTestId('field-requiredDate').getByTestId('input-validation-icon-error'),
  ).toBeVisible()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})

test(`publish button is disabled when invalid date is entered in the field`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateValidation')

  await expect(await page.getByTestId('field-requiredDate')).toBeVisible()

  await page.getByTestId('field-requiredDate').getByTestId('date-input').fill('20230101')
  // TODO: Remove this after fixing the blur test
  await page.getByTestId('field-requiredDate').getByTestId('date-input').blur()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})

test(`date input shows validation on entering date in the textfield and onBlur`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateValidation')

  await page.waitForSelector(`data-testid=field-requiredDate`)

  await page.getByTestId('field-requiredDate').getByTestId('date-input').fill('2023-01-01')
  await page.getByTestId('field-requiredDate').getByTestId('date-input').blur()

  await expect(
    page.getByTestId('field-requiredDate').getByTestId('input-validation-icon-error'),
  ).toBeVisible()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})
