import {test} from '@sanity/test'
import {expect} from '@playwright/test'

test(`datetime shows validation on selecting date from datepicker`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-datetime`)

  await page.getByTestId('field-datetime').getByTestId('select-date-button').click()
  await page.getByLabel('Mon Feb 19 2024').click()
  expect(
    await page.getByTestId('field-datetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

test(`datetime shows validation on entering date in the textfield`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-datetime`)

  await page.getByTestId('field-datetime').getByTestId('date-input').fill('2024-01-01 00:00')

  expect(
    await page.getByTestId('field-datetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})

// TODO: remove after fixing the issue
test(`datetime only shows validation on entering date in the textfield and onBlur`, async ({
  page,
  createDraftDocument,
}) => {
  await createDraftDocument('/test/content/input-debug;validationTest')

  await page.waitForSelector(`data-testid=field-datetime`)

  await page.getByTestId('field-datetime').getByTestId('date-input').fill('2024-01-01 00:00')
  await page.getByTestId('field-datetime').getByTestId('date-input').blur()

  expect(
    await page.getByTestId('field-datetime').getByTestId('input-validation-icon-error'),
  ).toBeVisible()
})
