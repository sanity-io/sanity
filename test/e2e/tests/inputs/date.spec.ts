import {test} from '@sanity/test'
import {expect} from '@playwright/test'

test(`date input shows validation on selecting date from datepicker`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-date`)

  await page.getByTestId('field-date').getByTestId('select-date-button').click()
  await page.getByLabel('Mon Feb 19 2024').click()
  await expect(
    page.getByTestId('field-date').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

test(`date input shows validation on entering date in the text field`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-date`)

  await page.getByTestId('field-date').getByTestId('date-input').fill('2024-01-01')

  await expect(
    page.getByTestId('field-date').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

test(`date input shows validation on entering date in the textfield and onBlur`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-date`)

  await page.getByTestId('field-date').getByTestId('date-input').fill('2024-01-01')
  await page.getByTestId('field-date').getByTestId('date-input').blur()

  await expect(
    page.getByTestId('field-date').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})
