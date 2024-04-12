import {expect} from '@playwright/test'
import {test} from '@sanity/test'

test('it is possible to create a new task from the tasks sidebar, edit and remove it.', async ({
  page,
  baseURL,
}) => {
  const taskName = `Test task ${Math.floor(Math.random() * 10000)}`
  await page.goto(baseURL ?? '/')
  await page.waitForTimeout(2000)
  const tasksNavbarButton = await page.getByRole('button', {name: 'Tasks'})
  await tasksNavbarButton.click()
  const newTaskButton = await page.getByTestId('create-task-button')
  await newTaskButton.click()

  // Completes the task entirely:
  // 1. Fill the title
  // 2. Fill the description
  // 3. Assign the task to a user
  // 4. Sets a deadline
  // 5. Selects the document target

  // 1. Fill the title
  await page.getByTestId('title-input').fill(taskName)
  await expect(page.getByTestId('title-input')).toHaveText(taskName)

  // 2. Fill the description
  await page.getByTestId('comment-input-editable').fill('Created from navbar in test')
  await expect(page.getByTestId('comment-input-editable')).toHaveText('Created from navbar in test')

  // 3. Assign the task to a user
  const selectAssigneeButton = await page.getByText('Select assignee')
  await selectAssigneeButton.click()
  await page.waitForSelector("[name='assigneeSearch']:focus") // Input should be in focus
  await page.locator("[name='assigneeSearch']").fill('Pedro Bonamin') // Search for the user
  await page.getByRole('menuitem', {name: 'Pedro Bonamin'}).click() // Select the user
  await expect(page.getByTestId('assigned-user')).toHaveText('Pedro Bonamin') // The user should be displayed

  // 4. Sets a deadline
  await page.getByTestId('select-date-button').click()
  await page.locator('div[aria-selected="true"][data-ui="CalendarDay"]').click() // Select the current date.
  await page.getByTestId('select-date-button').click()
  const inputValue = await page.inputValue("[data-testid='date-input']") // The date should be displayed
  await expect(inputValue).toBeDefined()

  // 5. Selects the document target
  await page.getByText('Select target document').click()
  await page.getByPlaceholder('Search').fill('Test - assign document')
  const targetContent = await page.waitForSelector(
    '[data-testid="default-preview__header"]:has-text("Test - assign document")',
  )
  await targetContent.click({force: true})

  // Create the task
  await page.getByRole('button', {name: 'Create Task'}).click()

  // Should navigate back to the list view at subscribed tab
  await page.waitForSelector('[id="subscribed-tab"][data-selected]')
  // The task should be visible in the list
  await page.getByRole('button', {name: taskName}).click()

  await page.getByTestId('comment-input-editable').fill(' and edited')
  await expect(page.getByTestId('comment-input-editable')).toHaveText(
    'Created from navbar in test and edited',
  )

  // Remove the task to clean up
  const taskMenuButton = await page.waitForSelector(`[id="edit-task-menu"]`)
  await taskMenuButton.click()
  await page.getByRole('menuitem', {name: 'Delete task'}).click()

  // Confirmation modal shows
  await expect(page.getByText('Delete this task?')).toBeVisible()
  await page.getByRole('button', {name: 'Delete'}).click()
  // Should navigate back to the list view at subscribed tab
  await page.waitForSelector('[id="subscribed-tab"][data-selected]')
})

test('It is possible to create a task from the document action', async ({page, baseURL}) => {
  const taskName = `Test task from document ${Math.floor(Math.random() * 10000)}`
  const documentName = 'Test- do not remove'
  const documentId = '945a97ac-e4b6-450e-a484-d0886f801461'
  const documentType = 'book'
  await page.goto(`${baseURL}/test/intent/edit/id=${documentId};type=${documentType}/`)
  await page.waitForTimeout(2000)
  await expect(page.getByTestId('document-panel-document-title')).toHaveText(documentName)

  await page
    .locator(
      '[id="documentEditor-945a97ac-e4b6-450e-a484-d0886f801461-0"] >> [data-testid=pane-context-menu-button]',
    )
    .click()

  await page.getByRole('menuitem', {name: 'Create new task'}).click()

  // It should have the document as target in the target field.
  await expect(page.getByTestId('task-target-field')).toContainText(documentName)
  const targetField = await page.waitForSelector(
    '[data-testid="task-target-field"] >> [data-testid="compact-preview__header"]',
  )
  expect(await targetField.textContent()).toBe(documentName)

  await page.getByTestId('title-input').fill(taskName)
  await expect(page.getByTestId('title-input')).toHaveText(taskName)
  await page.getByTestId('comment-input-editable').fill('Created from document in test')
  await expect(page.getByTestId('comment-input-editable')).toHaveText(
    'Created from document in test',
  )

  await page.getByRole('button', {name: 'Create Task'}).click()
  // Should navigate back to the list view at subscribed tab
  await page.waitForSelector('[id="subscribed-tab"][data-selected]')
  // The task should be visible in the list
  const taskInList = await page.getByRole('button', {name: taskName})

  // The document should show pending tasks.
  await expect(page.getByTestId('tasks-footer-open-tasks')).toBeVisible()

  // Remove the task to clean up
  await taskInList.click()
  const taskMenuButton = await page.waitForSelector(`[id="edit-task-menu"]`)
  await taskMenuButton.click()
  await page.getByRole('menuitem', {name: 'Delete task'}).click()
  await expect(page.getByText('Delete this task?')).toBeVisible()
  await page.getByRole('button', {name: 'Delete'}).click()
  await page.waitForSelector('[id="subscribed-tab"][data-selected]')
})
