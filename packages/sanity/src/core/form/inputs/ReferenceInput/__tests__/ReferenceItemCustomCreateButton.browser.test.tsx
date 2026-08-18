import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../test/browser/testHelpers'
import {
  CREATED_SECTION_ID,
  ReferenceItemCustomCreateButtonStory,
} from './ReferenceItemCustomCreateButtonStory'

// Regression tests for custom "Create new" actions rendered by custom
// item/input components next to the default reference input in arrays.
//
// When an empty reference item is added to an array, its search input is
// focused, and mousedowns outside the input clear (remove) the empty item.
// Custom UI rendered around the default input belongs to the same array item
// and must not count as "outside": clearing on mousedown unmounts the custom
// UI before its click handlers run, breaking custom create flows.
describe('reference array item with a custom create button', () => {
  it('clicking the custom create button completes the create flow instead of removing the item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonStory />)

    // Add an empty reference item to the array. Focus moves to its search input.
    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Click the custom "Create new" button rendered next to the default input.
    await page.getByTestId('custom-create-new-button').click()

    // The item must still be there, now referencing the created document.
    await waitForDocumentState((state) => state?.sections?.[0]?._ref === CREATED_SECTION_ID)
    await expect.element(page.getByTestId('custom-reference-item')).toBeVisible()
  })

  it('a mousedown on the custom item wrapper (just missing the button) keeps the item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonStory />)

    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Simulate a click that misses the button by a few pixels and lands on the
    // custom wrapper, which sits around the default input.
    page
      .getByTestId('custom-reference-item')
      .element()
      .dispatchEvent(new MouseEvent('mousedown', {bubbles: true, cancelable: true}))

    // Give a potential (faulty) clear a chance to remove the item before asserting.
    await new Promise((resolve) => setTimeout(resolve, 250))
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // The create flow still works afterwards.
    await page.getByTestId('custom-create-new-button').click()
    await waitForDocumentState((state) => state?.sections?.[0]?._ref === CREATED_SECTION_ID)
  })

  it('clicking outside the array item still clears the empty item', async () => {
    const {waitForDocumentState} = testHelpers()
    void render(<ReferenceItemCustomCreateButtonStory />)

    await page.getByTestId('add-single-object-button').click()
    await expect.element(page.getByTestId('custom-create-new-button')).toBeVisible()

    // Click a field outside the array item.
    await page.getByTestId('field-title').getByRole('textbox').click()

    // The empty item is removed.
    await waitForDocumentState((state) => (state?.sections ?? []).length === 0)
  })
})
