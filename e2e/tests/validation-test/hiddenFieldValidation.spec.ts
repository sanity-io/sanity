import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Hidden Field Validation Badge', () => {
  test.describe('when template is "none" with validation errors on hidden fields', () => {
    test('should show Hidden badge and reveal fields when clicking validation error', async ({
      page,
      createDraftDocument,
    }) => {
      test.slow()
      // Create a new document with the hiddenFieldValidationTest type
      await createDraftDocument('/content/input-debug;hiddenFieldValidationTest')

      await expect(page.locator('label').filter({hasText: 'Template A'})).toBeVisible({
        timeout: 5000,
      })
      await page.locator('label').filter({hasText: 'Template A'}).click()

      await expect(
        page.getByTestId('field-templateA.metadata.author').getByTestId('string-input'),
      ).toBeVisible({timeout: 5000})
      await expect(
        page.getByTestId('field-templateA.metadata.author').getByTestId('string-input'),
      ).toBeEnabled({timeout: 5000})
      await page
        .getByTestId('field-templateA.metadata.author')
        .getByTestId('string-input')
        .fill('Test Author')

      // This should trigger the valitioan error

      await expect(page.locator('label').filter({hasText: 'None'})).toBeVisible({timeout: 5000})
      await page.locator('label').filter({hasText: 'None'}).click()

      // The default template is 'none', so templateA fields should be hidden
      // But validation errors still exist on required fields in templateA

      // Wait for the validation button to appear (indicating validation errors exist)
      await expect(page.getByRole('button', {name: 'Validation'})).toBeVisible({timeout: 10000})

      // Click on validation to open the validation panel
      await page.getByRole('button', {name: 'Validation'}).click()

      // Wait for validation panel to show errors
      // There should be validation errors for templateA fields (Title, Subtitle, etc.)
      // The error should reference Template A / Title or similar
      const templateAValidationError = page.getByRole('button', {name: /Template A/})
      await expect(templateAValidationError.first()).toBeVisible({timeout: 10000})

      // Click on the validation error to navigate to the hidden field
      await templateAValidationError.first().click()

      // The hidden field should now be revealed and visible
      // Look for the Template A fieldset which should now be visible
      const templateAFieldset = page.getByTestId('field-templateA')
      await expect(templateAFieldset).toBeVisible({timeout: 5000})

      // The Hidden badge should be shown on the revealed field
      // The badge has data-testid="revealed-badge-{title}"
      const hiddenBadge = page.getByTestId(/revealed-badge/)
      await expect(hiddenBadge.first()).toBeVisible({timeout: 5000})

      // Verify the badge text says "Hidden"
      await expect(hiddenBadge.first()).toContainText('Hidden')
    })
  })

  test.describe('when template is "templateA" with validation errors on visible fields', () => {
    test('should NOT show Hidden badge when clicking validation error for visible fields', async ({
      page,
      createDraftDocument,
    }) => {
      test.slow()
      // Create a new document with the hiddenFieldValidationTest type
      await createDraftDocument('/content/input-debug;hiddenFieldValidationTest')

      // Change template to "templateA" so the templateA fields become visible
      // Find the radio button for Template A and click it
      const templateARadio = page.getByRole('radio', {name: 'Template A'})
      await expect(templateARadio).toBeVisible({timeout: 5000})
      await templateARadio.click()

      await expect(
        page.getByTestId('field-templateA.metadata.author').getByTestId('string-input'),
      ).toBeVisible({timeout: 5000})
      await expect(
        page.getByTestId('field-templateA.metadata.author').getByTestId('string-input'),
      ).toBeEnabled({timeout: 5000})
      await page
        .getByTestId('field-templateA.metadata.author')
        .getByTestId('string-input')
        .fill('Test Author')

      // This should trigger the valitioan error

      // Wait for the Template A fieldset to become visible (it's now not hidden)
      const templateAFieldset = page.getByTestId('field-templateA')
      await expect(templateAFieldset).toBeVisible({timeout: 5000})

      // Wait for the validation button to appear
      await expect(page.getByRole('button', {name: 'Validation'})).toBeVisible({timeout: 10000})

      // Click on validation to open the validation panel
      await page.getByRole('button', {name: 'Validation'}).click()

      // Wait for validation panel to show errors for Template A fields
      const templateAValidationError = page.getByRole('button', {name: /Template A/})
      await expect(templateAValidationError.first()).toBeVisible({timeout: 10000})

      // Click on the validation error to navigate to the field
      await templateAValidationError.first().click()

      // The field should already be visible (not hidden) so no badge should appear
      // Verify the Hidden badge is NOT shown
      const hiddenBadge = page.getByTestId(/revealed-badge/)
      await expect(hiddenBadge).not.toBeVisible({timeout: 2000})
    })
  })
})
