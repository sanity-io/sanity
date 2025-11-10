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
      await page.getByTestId('field-name').getByTestId('string-input').fill('Test House')
      await page.getByTestId('add-single-object-button').click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()

      await page.getByRole('button', {name: 'Close dialog'}).click()

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
      await page.getByRole('button', {name: 'Validation'}).click()

      await page.getByTestId('array-item-menu-button').click()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
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
      await page.getByTestId('field-name').getByTestId('string-input').fill('Test House')

      await page.getByTestId('add-single-object-button').click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      await page
        .getByTestId(/field-house\[.*\]\.name/)
        .getByTestId('string-input')
        .fill('Test Room')

      await page.getByRole('button', {name: 'Close dialog'}).click()

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      await page.getByTestId('add-single-object-button').click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      await page
        .getByTestId(/field-house\[.*\]\.name/)
        .getByTestId('string-input')
        .fill('Test Room 2')

      await page.getByRole('button', {name: 'Close dialog'}).click()

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()

      await page.getByRole('button', {name: 'Validation'}).click()

      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toHaveCount(2)

      await page.getByTestId('array-item-menu-button').first().click()
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

      await page.getByTestId('add-single-object-button').click()

      await expect(page.getByTestId('nested-object-dialog')).toBeVisible()
      await page
        .getByTestId(/field-house\[.*\]\.name/)
        .getByTestId('string-input')
        .fill('Test Room')

      await page.getByRole('button', {name: 'Close dialog'}).click()

      await expect(page.getByTestId('nested-object-dialog')).not.toBeVisible()
      await page.getByRole('button', {name: 'Validation'}).click()

      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(page.getByRole('button', {name: 'House / Room / List furniture'})).toBeVisible()

      await page.getByTestId('array-item-menu-button').first().click()
      await expect(page.getByRole('menuitem', {name: 'Remove'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Remove'}).click()

      await expect(page.getByRole('button', {name: 'Name Required'})).toBeVisible()
      await expect(
        page.getByRole('button', {name: 'House / Room / List furniture'}),
      ).not.toBeVisible()

      expect(errors).toHaveLength(0)
    })
  })
})
