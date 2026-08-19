import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {BASE_VARIANT_DOCUMENT, FormFieldGutterStory} from './FormFieldGutterStory'

/**
 * The form-integrated counterpart to `FormBaseVariantDiffIndicator.browser.test.tsx`, which drives
 * the indicator by prop. Here the indicator is driven by the `changedFromBaseVariant` that
 * `useFormState` derives from a base variant document, so these tests cover the seam the unit
 * tests in `store/__tests__/changedFromBaseVariant.test.ts` stop at: that the computed value
 * reaches the gutter of the *field it belongs to*.
 *
 * Scoping is by DOM containment: for a primitive field, `fieldResolver`'s `PrimitiveField` wraps
 * `FormField` (and so the `FormRow` holding the gutter cell) in `field-<name>`, which makes
 * "whose gutter is this?" answerable without resorting to geometry.
 */

const INDICATOR = 'base-variant-diff-indicator'

describe('FormFieldGutter base variant diff indicator', () => {
  it('marks the field whose value differs from the base variant', async () => {
    void render(<FormFieldGutterStory baseVariantDocument={BASE_VARIANT_DOCUMENT} />)

    await expect.element(page.getByTestId('field-title').getByTestId(INDICATOR)).toBeVisible()
  })

  it('leaves a field that matches the base variant unmarked', async () => {
    void render(<FormFieldGutterStory baseVariantDocument={BASE_VARIANT_DOCUMENT} />)

    // Wait for the marked field first, so the absence below is asserted against a form that has
    // finished rendering rather than one that has not started.
    await expect.element(page.getByTestId('field-title').getByTestId(INDICATOR)).toBeVisible()

    await expect.element(page.getByTestId('field-subtitle')).toBeVisible()
    expect(page.getByTestId('field-subtitle').getByTestId(INDICATOR).elements()).toHaveLength(0)

    // Only `title` is marked: catches an indicator that renders for every field regardless.
    expect(page.getByTestId(INDICATOR).elements()).toHaveLength(1)
  })

  it('marks nothing when there is no base variant to compare against', async () => {
    void render(<FormFieldGutterStory />)

    await expect.element(page.getByTestId('field-title')).toBeVisible()
    await expect.element(page.getByTestId('field-subtitle')).toBeVisible()

    // `title` differs from BASE_VARIANT_DOCUMENT, so this pins the `hasBaseVariant` gate rather
    // than merely observing that the values happen to match.
    expect(page.getByTestId(INDICATOR).elements()).toHaveLength(0)
  })
})
