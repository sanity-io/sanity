import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('clicking on the footer tasks button shows document tasks', async ({page, baseURL}) => {
  const documentId = '5103da86-77f1-47c0-869d-713e92f2657e'
  const documentType = 'book'
  await page.goto(`${baseURL}/test/intent/edit/id=${documentId};type=${documentType}/`)
  await page.waitForTimeout(2000)
  await page.getByTestId('tasks-footer-open-tasks').click()
  // Should navigate back to the list view at subscribed tab
  await page.waitForSelector('[id="document-tab"][data-selected]')
  // The task should be visible in the list
  await expect(page.getByRole('button', {name: 'Test task - do not remove'})).toBeVisible()
})

test('navbar navigation button should work as a toggle', async ({page, baseURL}) => {
  await page.goto(baseURL ?? '/')
  await page.waitForTimeout(2000)
  const tasksNavbarButton = await page.getByRole('button', {name: 'Tasks'})
  await tasksNavbarButton.click()
  await expect(page.getByTestId('tasks-sidebar-header')).toBeVisible()
  await tasksNavbarButton.click()
  await expect(page.getByTestId('tasks-sidebar-header')).not.toBeVisible()
})

test('visiting the studio with a task link should redirect to the task', async ({
  page,
  baseURL,
}) => {
  await page.goto(
    `${
      baseURL ?? '/'
    }/test/content/?sidebar=tasks&viewMode=edit&selectedTask=8409b5ad-5204-4cdb-9965-cb49beddf615`,
  )
  await page.waitForTimeout(2000)

  await expect(page.getByText('Test task - do not remove')).toBeVisible()
})
