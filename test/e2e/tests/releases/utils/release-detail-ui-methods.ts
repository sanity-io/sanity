import {expect, type Page} from '@playwright/test'

/** This method follows the archiving and confirming from the release detail page */
export const archiveAndConfirmRelease = async ({page}: {page: Page}) => {
  await page.getByTestId('release-menu-button').click()
  await expect(page.getByTestId('archive-release-menu-item')).toBeVisible()
  await page.getByTestId('archive-release-menu-item').click()
  await expect(page.getByTestId('confirm-archive-dialog')).toBeVisible()
  await page.getByTestId('confirm-button').click()
  await expect(page.getByTestId('confirm-archive-dialog')).not.toBeVisible()

  await expect(page.getByTestId('retention-policy-card')).toBeVisible()
}
/** This method follows the unarchiving and confirming from the release detail page */
export const unarchiveAndConfirmRelease = async ({page}: {page: Page}) => {
  await page.getByTestId('release-menu-button').click()
  await expect(page.getByTestId('unarchive-release-menu-item')).toBeVisible()
  await page.getByTestId('unarchive-release-menu-item').click()
  await expect(page.getByTestId('retention-policy-card')).not.toBeVisible()
}

/** This method follows the scheduling and confirming from the release detail page
 *  date should be a date example:new Date(new Date().setMinutes(new Date().getMinutes() + 20)) - current date + 20 minutes
 */
export const scheduleAndConfirmReleaseMenu = async ({page, date}: {page: Page; date: Date}) => {
  await expect(await page.getByTestId('release-menu-button')).toBeVisible()
  await page.getByTestId('release-menu-button').click()
  await expect(page.getByTestId('schedule-button-menu-item')).not.toBeDisabled()

  await expect(page.getByTestId('schedule-button-menu-item')).toBeVisible()
  await page.getByTestId('schedule-button-menu-item').click()
  await expect(page.getByTestId('confirm-schedule-dialog')).toBeVisible()

  await page.getByTestId('select-date-button').click()
  await expect(page.getByTestId('date-input-dialog')).toBeVisible()
  await page.getByRole('textbox', {name: 'Select time'}).click()

  // sets release to happen in 20 minutes
  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  await page.getByRole('textbox', {name: 'Select time'}).fill(timeString)
  await page.getByTestId('date-input-dialog').click()
  await page.getByTestId('select-date-button').click()
  await expect(page.getByTestId('date-input-dialog')).not.toBeVisible()

  await expect(page.getByTestId('confirm-button')).not.toBeDisabled()

  await page.getByTestId('confirm-button').click()
  await expect(page.getByTestId('confirm-schedule-dialog')).not.toBeVisible()
  await expect(page.getByTestId('release-type-picker')).toBeDisabled()
}

/** This method follows the scheduling and confirming from the release detail page
 *  date should be a date example:new Date(new Date().setMinutes(new Date().getMinutes() + 20)) - current date + 20 minutes
 */
export const scheduleAndConfirmRelease = async ({page, date}: {page: Page; date: Date}) => {
  await expect(page.getByTestId('schedule-button')).not.toBeDisabled()
  await page.getByTestId('schedule-button').click()

  await expect(page.getByTestId('confirm-schedule-dialog')).toBeVisible()

  await page.getByTestId('select-date-button').click()
  await expect(page.getByTestId('date-input-dialog')).toBeVisible()
  await page.getByRole('textbox', {name: 'Select time'}).click()

  // sets release to happen in 20 minutes
  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  await page.getByRole('textbox', {name: 'Select time'}).fill(timeString)
  await page.getByTestId('date-input-dialog').click()
  await page.getByTestId('select-date-button').click()
  await expect(page.getByTestId('date-input-dialog')).not.toBeVisible()

  await expect(page.getByTestId('confirm-button')).not.toBeDisabled()

  await page.getByTestId('confirm-button').click()
  await expect(page.getByTestId('confirm-schedule-dialog')).not.toBeVisible()
  await expect(page.getByTestId('release-type-picker')).toBeDisabled()
}

/** This method follows the unscheduling and confirming from the release detail page */
export const unscheduleAndConfirmRelease = async ({page}: {page: Page}) => {
  await page.getByTestId('schedule-button').click()
  await expect(page.locator('#confirm-unschedule-dialog')).toBeVisible()
  await expect(page.getByTestId('confirm-button')).not.toBeDisabled()
  await page.getByTestId('confirm-button').click()
  await expect(page.locator('#confirm-unschedule-dialog')).not.toBeVisible()
  await expect(page.getByTestId('release-type-picker')).not.toBeDisabled()
}

/** This method follows the publishing and confirming from the release detail page */
export const publishAndConfirmRelease = async ({page}: {page: Page}) => {
  await expect(page.getByTestId('publish-all-button')).toBeVisible()
  await page.getByTestId('publish-all-button').click()
  await expect(page.getByTestId('confirm-publish-dialog')).toBeVisible()
  await page.getByTestId('confirm-button').click()
  await expect(page.getByText('This release is published')).toBeVisible()
}

/** This method follows the publishing and confirming from the release detail page */
export const publishAndConfirmReleaseMenu = async ({page}: {page: Page}) => {
  await expect(await page.getByTestId('release-menu-button')).toBeVisible()
  await page.getByTestId('release-menu-button').click()
  await expect(page.getByTestId('publish-all-button-menu-item')).not.toBeDisabled()

  await expect(page.getByTestId('publish-all-button-menu-item')).toBeVisible()
  await page.getByTestId('publish-all-button-menu-item').click()

  await expect(page.getByTestId('confirm-publish-dialog')).toBeVisible()
  await page.getByTestId('confirm-button').click()
  await expect(page.getByText('This release is published')).toBeVisible()
}

/** This method follows the reverting and confirming from the release detail page */
export const revertAndConfirmRelease = async ({page}: {page: Page}) => {
  await expect(await page.getByTestId('revert-button')).toBeVisible()
  await expect(await page.getByTestId('revert-button')).not.toBeDisabled()
  await page.getByTestId('revert-button').click()
  await expect(page.locator('#confirm-revert-dialog')).toBeVisible()
  await expect(page.getByTestId('confirm-button')).toBeVisible()
  await page.getByTestId('confirm-button').click()
  await expect(page.locator('#confirm-revert-dialog')).not.toBeVisible()
}
