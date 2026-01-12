/**
 * E2E test for PR #11776: Icon/deprecated badge overlap fix
 *
 * Issue: #10723
 * The StatusIconWrapper in FormFieldValidationStatus had CSS positioning
 * (position: relative; left: 8px) that caused the validation icon to
 * overlap with the deprecated badge.
 */

import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('PR #11776 - Icon/deprecated badge overlap', () => {
  test('validation icon should not overlap with deprecated badge', async ({
    page,
    createDraftDocument,
  }) => {
    // Navigate to deprecated fields document
    await createDraftDocument('/content/input-debug;deprecatedFields')

    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // Find a field with both validation error and deprecated badge
    // The 'string' field has validation: Rule.required() and deprecated: true
    const stringField = page.getByTestId('field-string')
    await expect(stringField).toBeVisible()

    // The field should show both the deprecated badge and validation status
    const deprecatedBadge = page.getByTestId('deprecated-badge-string')
    await expect(deprecatedBadge).toBeVisible()
    await expect(deprecatedBadge).toHaveText('deprecated')

    // Take a screenshot for visual regression testing
    // This captures the validation status area to verify no overlap
    await expect(stringField).toHaveScreenshot('string-field-deprecated-validation.png', {
      maxDiffPixels: 100,
    })
  })

  test('deprecated badge position should not cause layout issues', async ({
    page,
    createDraftDocument,
  }) => {
    await createDraftDocument('/content/input-debug;deprecatedFields')

    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({
      timeout: 40000,
    })

    // Check multiple field types with deprecated badges
    const fieldTypes = ['string', 'number', 'boolean', 'email']

    for (const fieldType of fieldTypes) {
      const badge = page.getByTestId(`deprecated-badge-${fieldType}`)
      await expect(badge).toBeVisible()

      // Get bounding box to verify no unexpected positioning
      const boundingBox = await badge.boundingBox()
      expect(boundingBox).not.toBeNull()

      // Badge should have reasonable dimensions (not squeezed or overlapping)
      if (boundingBox) {
        expect(boundingBox.width).toBeGreaterThan(50) // "deprecated" text needs space
        expect(boundingBox.height).toBeGreaterThan(10)
      }
    }
  })
})
