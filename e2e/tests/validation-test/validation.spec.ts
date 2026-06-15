import {expect} from '@playwright/test'

import {retryingClickUntilVisible} from '../../helpers/retryingClick'
import {test} from '../../studio-test'

test.describe('Validation test', () => {
  test.describe('should not throw error when a validation error is present', () => {
    test('and the one array item has been deleted', async ({page, createDraftDocument}) => {
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
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeVisible()
      await expect(page.getByTestId('field-name').getByTestId('string-input')).toBeEnabled()
      await page.getByTestId('field-name').getByTestId('string-input').fill('Test House')

      const addButton = page.getByTestId('add-single-object-button')
      await expect(addButton).toBeVisible()
      await expect(addButton).toBeEnabled()
      // Use force to bypass any pointer-events issues in Firefox
      await addButton.click({force: true})

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      const roomNameInput = page.getByTestId(/field-house\[.*\]\.name/).getByTestId('string-input')
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room')

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Wait for the form to reflect the newly-added array row before opening the
      // Validation panel. Without this, the click-through to `array-item-menu-button`
      // races against the array re-render that follows the Escape/close-dialog
      // mutation and can target a stale (about-to-unmount) node.
      const arrayItemMenuButton = page.getByTestId('array-item-menu-button')
      await expect(arrayItemMenuButton).toHaveCount(1)

      const validationButton = page.getByRole('button', {name: 'Validation'})
      await expect(validationButton).toBeVisible()
      await expect(validationButton).toBeEnabled()
      await validationButton.click()

      // The Validation inspector mounts async and reflows the pane; wait for at
      // least one validation marker to land (the nested furniture list error)
      // before interacting with the array row menu.
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toBeVisible()

      await expect(arrayItemMenuButton).toBeVisible()
      await expect(arrayItemMenuButton).toBeEnabled()
      await retryingClickUntilVisible(
        page,
        arrayItemMenuButton,
        page.getByRole('menuitem', {name: 'Remove'}),
      )
      const removeMenuItem = page.getByRole('menuitem', {name: 'Remove'})
      await expect(removeMenuItem).toBeEnabled()
      await removeMenuItem.click()

      await expect(
        page.getByRole('button', {name: 'Room cant be unfurnished!', exact: true}),
      ).not.toBeVisible()

      expect(errors).toHaveLength(0)
    })

    test('and the one array item has been deleted when there are more than one item with errors', async ({
      page,
      createDraftDocument,
    }) => {
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

      // Wait for the first row to be committed to the form before adding the
      // second. This guards against the flake where clicking `add` again while
      // the first row is still mid-mount silently no-ops.
      const arrayItemMenuButton = page.getByTestId('array-item-menu-button')
      await expect(arrayItemMenuButton).toHaveCount(1)

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

      // Wait for BOTH array rows to appear in the form before opening validation.
      // Previously the test jumped straight to clicking the Validation button;
      // if the second row hadn't finished mounting, the validation inspector
      // would render only one marker and the `toHaveCount(2)` below would flake.
      await expect(arrayItemMenuButton).toHaveCount(2)

      const validationButton = page.getByRole('button', {name: 'Validation'})
      await expect(validationButton).toBeVisible()
      await expect(validationButton).toBeEnabled()

      // Click and wait for validation panel to open by waiting for validation items
      await validationButton.click()

      // Wait for validation items to appear - checking count first ensures they're all rendered
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toHaveCount(
        2,
        {timeout: 10000},
      )

      const firstMenuButton = arrayItemMenuButton.first()
      await expect(firstMenuButton).toBeVisible()
      await expect(firstMenuButton).toBeEnabled()
      await retryingClickUntilVisible(
        page,
        firstMenuButton,
        page.getByRole('menuitem', {name: 'Remove'}),
      )
      const removeMenuItem = page.getByRole('menuitem', {name: 'Remove'})
      await expect(removeMenuItem).toBeEnabled()
      await removeMenuItem.click()
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toHaveCount(1)

      expect(errors).toHaveLength(0)
    })

    test('and the one array item has been deleted there are more validation errors outside of the array', async ({
      page,
      createDraftDocument,
    }) => {
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
      // Use force to bypass any pointer-events issues in Firefox
      await addButton.click({force: true})

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      const roomNameInput = page.getByTestId(/field-house\[.*\]\.name/).getByTestId('string-input')
      await expect(roomNameInput).toBeVisible()
      await expect(roomNameInput).toBeEnabled()
      await roomNameInput.fill('Test Room')

      await page.keyboard.press('Escape')

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      // Ensure the newly-added array row is present in the form before opening
      // the validation inspector; prevents a race with the post-dialog re-render.
      const arrayItemMenuButtons = page.getByTestId('array-item-menu-button')
      await expect(arrayItemMenuButtons).toHaveCount(1)

      const validationButton = page.getByRole('button', {name: 'Validation'})
      await expect(validationButton).toBeVisible()
      await expect(validationButton).toBeEnabled()
      await validationButton.click()

      // Both validation markers must be present before removing the array row,
      // otherwise the subsequent assertions fail intermittently because the
      // marker list is populated by an async validation run that can trail the
      // mutation.
      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toBeVisible()

      const arrayItemMenuButton = arrayItemMenuButtons.first()
      await expect(arrayItemMenuButton).toBeVisible()
      await expect(arrayItemMenuButton).toBeEnabled()
      await retryingClickUntilVisible(
        page,
        arrayItemMenuButton,
        page.getByRole('menuitem', {name: 'Remove'}),
      )
      const removeMenuItem = page.getByRole('menuitem', {name: 'Remove'})
      await expect(removeMenuItem).toBeEnabled()
      await removeMenuItem.click()

      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(
        page.getByRole('button', {name: 'House / Room / List furniture'}),
      ).not.toBeVisible()

      expect(errors).toHaveLength(0)
    })
  })
})
