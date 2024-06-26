import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test(`datetime input shows validation on selecting date from datepicker`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateTimeValidation')

  await page.waitForSelector(`data-testid=field-requiredDatetime`)

  await page.getByTestId('field-requiredDatetime').getByTestId('select-date-button').click()
  await page.getByTestId('date-input-dialog').getByTestId('date-input').fill('2023')
  await page.getByTestId('date-input-dialog').getByTestId('date-input').press('Enter')
  await page.getByTestId('date-input-dialog').getByRole('combobox').first().selectOption('0')
  await expect(await page.getByLabel('Sun Jan 01 2023')).toBeVisible()
  await page.getByLabel('Sun Jan 01 2023').click()

  await expect(
    page.getByTestId('field-requiredDatetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

test.skip(`datetime input shows validation on entering date in the textfield`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateTimeValidation')

  await page.waitForSelector(`data-testid=field-requiredDatetime`)

  await page
    .getByTestId('field-requiredDatetime')
    .getByTestId('date-input')
    .fill('2023-01-01 00:00')

  await expect(
    page.getByTestId('field-requiredDatetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

test(`publish button is disabled when invalid date is entered in the field`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateTimeValidation')

  await expect(await page.getByTestId('field-requiredDatetime')).toBeVisible()

  await page.getByTestId('field-requiredDatetime').getByTestId('date-input').fill('2023010100:00')
  // TODO: Remove this after fixing the blur test
  await page.getByTestId('field-requiredDatetime').getByTestId('date-input').blur()

  await expect(page.getByTestId('action-Publish')).toBeDisabled()
})

test(`datetime inputs shows validation on entering date in the textfield and onBlur`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;dateTimeValidation')

  await expect(await page.getByTestId('field-requiredDatetime')).toBeVisible()

  await page
    .getByTestId('field-requiredDatetime')
    .getByTestId('date-input')
    .fill('2023-01-01 00:00')
  await page.getByTestId('field-requiredDatetime').getByTestId('date-input').blur()

  await expect(
    page.getByTestId('field-requiredDatetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})
