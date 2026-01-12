import {expect} from '@playwright/test'

import {test} from '../../studio-test'

test.describe('Array drag-to-reorder', () => {
  test.beforeEach(async ({page, createDraftDocument}) => {
    test.slow()
    await createDraftDocument('/content/input-standard;arraysTest')
    await expect(page.getByTestId('document-panel-scroller')).toBeAttached({timeout: 40000})
  })

  test('should reorder array items via drag and drop', async ({page}) => {
    // Use the inlineEditingArray field which allows direct item creation
    const field = page.getByTestId('field-inlineEditingArray')
    const addItemButton = field.getByRole('button', {name: 'Add item'})

    // Add three items to the array
    await addItemButton.click()
    const dialog1 = page.getByRole('dialog')
    await dialog1.getByLabel('Title').fill('First Item')
    await page.keyboard.press('Escape')
    await expect(dialog1).not.toBeVisible()

    await addItemButton.click()
    const dialog2 = page.getByRole('dialog')
    await dialog2.getByLabel('Title').fill('Second Item')
    await page.keyboard.press('Escape')
    await expect(dialog2).not.toBeVisible()

    await addItemButton.click()
    const dialog3 = page.getByRole('dialog')
    await dialog3.getByLabel('Title').fill('Third Item')
    await page.keyboard.press('Escape')
    await expect(dialog3).not.toBeVisible()

    // Wait for items to render
    const items = field.locator('[data-ui="Grid"] > div')
    await expect(items).toHaveCount(3)

    // Verify initial order
    await expect(items.nth(0)).toContainText('First Item')
    await expect(items.nth(1)).toContainText('Second Item')
    await expect(items.nth(2)).toContainText('Third Item')

    // Get the drag handle of the third item
    const thirdItem = items.nth(2)
    const thirdDragHandle = thirdItem.locator('[data-ui="DragHandleButton"]')

    // Get bounding box for drag operation
    const handleBox = await thirdDragHandle.boundingBox()
    if (!handleBox) {
      throw new Error('Could not get bounding box for drag handle')
    }

    // Get the first item's position to drag to
    const firstItem = items.nth(0)
    const firstBox = await firstItem.boundingBox()
    if (!firstBox) {
      throw new Error('Could not get bounding box for first item')
    }

    // Perform drag operation - drag third item to before first item
    // The activation constraint requires 5px movement before drag starts (our fix in #11782)
    const startX = handleBox.x + handleBox.width / 2
    const startY = handleBox.y + handleBox.height / 2
    const endX = firstBox.x + firstBox.width / 2
    const endY = firstBox.y + 5 // Drag to top of first item

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    // Move with multiple steps to ensure smooth drag and activation constraint is met
    await page.mouse.move(endX, endY, {steps: 20})
    await page.mouse.up()

    // Wait for reorder animation to complete
    await page.waitForTimeout(300)

    // Verify the new order - Third Item should now be first
    await expect(items.nth(0)).toContainText('Third Item')
    await expect(items.nth(1)).toContainText('First Item')
    await expect(items.nth(2)).toContainText('Second Item')
  })

  test('click on drag handle should not trigger drag (activation constraint)', async ({page}) => {
    // This test verifies that the 5px activation constraint prevents accidental drags
    const field = page.getByTestId('field-inlineEditingArray')
    const addItemButton = field.getByRole('button', {name: 'Add item'})

    // Add two items
    await addItemButton.click()
    const dialog1 = page.getByRole('dialog')
    await dialog1.getByLabel('Title').fill('First Item')
    await page.keyboard.press('Escape')

    await addItemButton.click()
    const dialog2 = page.getByRole('dialog')
    await dialog2.getByLabel('Title').fill('Second Item')
    await page.keyboard.press('Escape')

    const items = field.locator('[data-ui="Grid"] > div')
    await expect(items).toHaveCount(2)

    // Click on the first item's drag handle (without dragging)
    const firstDragHandle = items.nth(0).locator('[data-ui="DragHandleButton"]')
    await firstDragHandle.click()

    // Verify order is unchanged (click didn't accidentally trigger a drag)
    await expect(items.nth(0)).toContainText('First Item')
    await expect(items.nth(1)).toContainText('Second Item')
  })
})
