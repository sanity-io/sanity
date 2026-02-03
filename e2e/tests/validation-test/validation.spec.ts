import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Validation test', () => {
  test.describe('should not throw error when a validation error is present', () => {
    test('and the one array item has been deleted', async ({page, createDraftDocument}) => {
      test.slow()
      const errors: string[] = []

      // eslint-disable-next-line max-nested-callbacks
      page.on('console', (msg) => {
        if (
          msg.type() === 'error' &&
          msg
            .text()
            .includes(
              'Error: Parent value is not an array, cannot get path segment: [_key == [object Object]]',
            )
        ) {
          errors.push(msg.text())
        }
      })

      await createDraftDocument('/content/house')
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeEnabled()
      await page.getByTestId('field-name').getByTestId('string-input').fill('Test House')
      await expect(page.getByTestId('add-single-object-button')).toBeVisible()
      await expect(page.getByTestId('add-single-object-button')).toBeEnabled()
      await page.getByTestId('add-single-object-button').click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      const roomNameInput = page.getByTestId(/field-house\[.*\]\.name/).getByTestId('string-input')
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room')

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
      await expect(page.getByRole('button', {name: 'Validation'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'Validation'})).toBeEnabled()
      await page.getByRole('button', {name: 'Validation'}).click()

      const arrayItemMenuButton = page.getByTestId('array-item-menu-button')
      await expect(arrayItemMenuButton).toBeVisible()
      await expect(arrayItemMenuButton).toBeEnabled()
      await arrayItemMenuButton.click()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeEnabled()
      await page.getByRole('menuitem', {name: 'Remove'}).click()

      await expect(
        page.getByRole('button', {name: 'Room cant be unfurnished!', exact: true}),
      ).not.toBeVisible()

      expect(errors).toHaveLength(0)
    })

    test('and the one array item has been deleted when there are more than one item with errors', async ({
      page,
      createDraftDocument,
    }) => {
      test.slow()

      const errors: string[] = []

      // eslint-disable-next-line max-nested-callbacks
      page.on('console', (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Error: Array item not found: [')) {
          errors.push(msg.text())
        }
      })

      await createDraftDocument('/content/house')
      await expect(page.getByTestId('document-panel-scroller')).toBeVisible()
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeEnabled()
      await page.getByTestId('field-name').getByTestId('string-input').fill('Test House')

      // Wait for the add button to be ready and interactable
      const addButton = page.getByTestId('add-single-object-button')
      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()
      // Use force to bypass any pointer-events issues in Firefox
      await addButton.click({timeout: 15000, force: true})

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      const roomNameInput = page.getByTestId(/field-house\[.*\]\.name/).getByTestId('string-input')
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room', {timeout: 15000})

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Wait for the add button to be ready again after closing the dialog
      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()
      // Use force to bypass any pointer-events issues in Firefox
      await addButton.click({timeout: 15000, force: true})

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room 2', {timeout: 15000})

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      await expect(page.getByRole('button', {name: 'Validation'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'Validation'})).toBeEnabled()

      // Click and wait for validation panel to open by waiting for validation items
      await page.getByRole('button', {name: 'Validation'}).click()

      // Wait for validation items to appear - checking count first ensures they're all rendered
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toHaveCount(
        2,
        {timeout: 10000},
      )

      await expect(page.getByTestId('array-item-menu-button').first()).toBeVisible()
      await expect(page.getByTestId('array-item-menu-button').first()).toBeEnabled()
      await page.getByTestId('array-item-menu-button').first().click()

      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeEnabled()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Remove'}).click()
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toHaveCount(1)

      expect(errors).toHaveLength(0)
    })

    test('and the one array item has been deleted there are more validation errors outside of the array', async ({
      page,
      createDraftDocument,
    }) => {
      test.slow()

      const errors: string[] = []

      // eslint-disable-next-line max-nested-callbacks
      page.on('console', (msg) => {
        if (
          msg.type() === 'error' &&
          msg
            .text()
            .includes(
              'Error: Parent value is not an array, cannot get path segment: [_key == [object Object]]',
            )
        ) {
          errors.push(msg.text())
        }
      })

      await createDraftDocument('/content/house')

      await expect(page.getByTestId('document-panel-scroller')).toBeVisible()

      const addButton = page.getByTestId('add-single-object-button')
      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()
      await addButton.click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      const roomNameInput = page.getByTestId(/field-house\[.*\]\.name/).getByTestId('string-input')
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room')

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
      await expect(page.getByRole('button', {name: 'Validation'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'Validation'})).toBeEnabled()
      await page.getByRole('button', {name: 'Validation'}).click()

      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toBeVisible()

      const arrayItemMenuButton = page.getByTestId('array-item-menu-button').first()
      await expect(arrayItemMenuButton).toBeVisible()
      await expect(arrayItemMenuButton).toBeEnabled()
      await arrayItemMenuButton.click()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeEnabled()
      await page.getByRole('menuitem', {name: 'Remove'}).click()

      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(
        page.getByRole('button', {name: 'House / Room / List furniture'}),
      ).not.toBeVisible()

      expect(errors).toHaveLength(0)
    })
  })
})
