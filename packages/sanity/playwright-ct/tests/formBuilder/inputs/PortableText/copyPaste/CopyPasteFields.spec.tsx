/* eslint-disable max-nested-callbacks */

// import {expect, test} from '@playwright/experimental-ct-react'
import {type Path, type SanityDocument} from '@sanity/types'

import {expect, test} from '../../../../fixtures'
import CopyPasteFieldsStory from './CopyPasteFieldsStory'

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  arrayOfPrimitives: ['One', 'Two', true],
  arrayOfMultipleTypes: [
    {
      _key: '6724abb6eee4',
      _type: 'color',
      title: 'Alright, testing this. Testing this as well tresting to typing here ee e',
    },
  ],
}

test.describe('Copy and pasting fields', () => {
  test.beforeEach(async ({page, browserName}) => {
    test.skip(browserName === 'webkit', 'Currently not working in Webkit')
  })

  test.describe('Object input', () => {
    // TODO: fix this test
    test.skip(`Copy and paste via field actions`, async ({
      browserName,
      getClipboardItemsAsText,
      mount,
      page,
    }) => {
      await mount(<CopyPasteFieldsStory document={document} />)

      await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      const $object = page.getByTestId('field-objectWithColumns').locator(`[tabindex="0"]`).first()

      await expect($object).toBeVisible()

      await page
        .getByTestId('field-objectWithColumns.string1')
        .locator('input')
        .fill('A string to copy')

      await page
        .getByTestId('field-objectWithColumns.string2')
        .locator('input')
        .fill('This is the second field')

      await expect(
        page.getByTestId('field-objectWithColumns.string2').locator('input'),
      ).toHaveValue('This is the second field')

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      let $fieldActions = page
        .getByTestId('field-actions-menu-objectWithColumns')
        .getByTestId('field-actions-trigger')

      await $fieldActions.focus()
      await expect($fieldActions).toBeFocused()
      await $fieldActions.press('Enter')

      await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).press('Enter')

      await expect(page.getByText(`Field "Object with columns" copied`)).toBeVisible()

      // Check that the plain text version is set
      await expect(await getClipboardItemsAsText()).toContain('A string to copy')
      await expect(await getClipboardItemsAsText()).toContain('This is the second field')

      await page.getByTestId('field-objectWithColumns.string1').locator('input').focus()
      await page.keyboard.press('Meta+A')
      await page.keyboard.press('Delete')

      $fieldActions = page
        .getByTestId('field-actions-menu-objectWithColumns')
        .getByTestId('field-actions-trigger')

      await $fieldActions.focus()

      await expect($fieldActions).toBeVisible()

      await $fieldActions.press('Enter')

      await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).press('Enter')

      await expect(page.getByText(`Field "Object with columns" updated`)).toBeVisible()

      await expect(
        page.getByTestId('field-objectWithColumns.string1').locator('input'),
      ).toHaveValue('A string to copy')
    })

    // TODO: fix this test
    test.skip(`Copy via keyboard shortcut`, async ({
      browserName,
      getClipboardItemsAsText,
      mount,
      page,
    }) => {
      await mount(<CopyPasteFieldsStory document={document} />)

      await expect(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      const $object = page.getByTestId('field-objectWithColumns').locator(`[tabindex="0"]`).first()

      await expect($object).toBeVisible()

      await page
        .getByTestId('field-objectWithColumns.string1')
        .locator('input')
        .fill('A string to copy')

      await page
        .getByTestId('field-objectWithColumns.string2')
        .locator('input')
        .fill('This is the second field')

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      await $object.focus()
      await expect($object).toBeFocused()
      await $object.press('ControlOrMeta+C')

      await expect(page.getByText(`Field "Object with columns" copied`)).toBeVisible()

      // Check that the plain text version is set
      await expect(await getClipboardItemsAsText()).toContain('A string to copy')
      await expect(await getClipboardItemsAsText()).toContain('This is the second field')

      await $object.focus()
      await expect($object).toBeFocused()
      await $object.press('ControlOrMeta+V')

      await expect(page.getByText(`Field "Object with columns" updated`)).toBeVisible()

      await expect(
        page.getByTestId('field-objectWithColumns.string1').locator('input'),
      ).toHaveValue('A string to copy')
    })
  })

  test.describe('String input', () => {
    // TODO: fix this test
    test.skip(`Copy and pasting via field actions`, async ({
      browserName,
      scrollToTop,
      getClipboardItemsAsText,
      mount,
      page,
    }) => {
      await mount(<CopyPasteFieldsStory document={document} />)

      await scrollToTop(page.getByTestId(`field-title`))
      await expect(page.getByTestId(`field-title`)).toBeVisible()

      await page.getByTestId('field-title').locator('input').fill('A string to copy')
      await expect(page.getByTestId('field-title').locator('input')).toHaveValue('A string to copy')

      const fieldActionsId = 'field-actions-menu-title'
      const fieldActionsTriggerId = 'field-actions-trigger'

      await scrollToTop(page.getByTestId(fieldActionsId))
      await page.getByTestId(fieldActionsId).getByTestId(fieldActionsTriggerId).press('Enter')

      // await scrollToTop(page.getByRole('menuitem', {name: 'Copy field'}))
      await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).press('Enter')

      await expect(page.getByText(`Field "Title" copied`)).toBeVisible()

      // Check that the plain text version is set
      await expect(await getClipboardItemsAsText()).toContain('A string to copy')

      await page.getByTestId('field-title').locator('input').fill('')

      // Trigger the field actions menu
      await scrollToTop(page.getByTestId(fieldActionsId))
      await page.getByTestId(fieldActionsId).getByTestId(fieldActionsTriggerId).press('Enter')

      // Click on the "Paste field" option in the menu
      await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).press('Enter')

      // Verify that the field content is updated with the pasted value
      await expect(page.getByText(`Field "Title" updated`)).toBeVisible()
      await expect(page.getByTestId('field-title').locator('input')).toHaveValue('A string to copy')
    })
  })

  test.describe('Array input', () => {
    // TODO: fix this test
    test.skip(`Copy and pasting via field actions`, async ({
      browserName,
      getClipboardItemsAsText,
      mount,
      page,
    }) => {
      await mount(<CopyPasteFieldsStory document={document} />)

      await expect(page.getByTestId(`field-arrayOfPrimitives`)).toBeVisible()

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      await page
        .getByTestId('field-actions-menu-arrayOfPrimitives')
        .getByTestId('field-actions-trigger')
        .press('Enter')

      await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).press('Enter')

      await expect(page.getByText(`Field "Array of primitives" copied`)).toBeVisible()

      // Check that the plain text version is set
      await expect(await getClipboardItemsAsText()).toContain('One, Two')

      const $rowActionTrigger = page.locator('[id="arrayOfPrimitives[0]-menuButton"]')

      await $rowActionTrigger.focus()
      await expect($rowActionTrigger).toBeFocused()
      await $rowActionTrigger.press('Enter')

      const $removeButton = page.getByRole('menuitem', {name: 'Remove'}).first()

      await expect($removeButton).toBeVisible()

      await $removeButton.press('Enter')

      expect(
        page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
      ).not.toHaveValue('One')
      expect(
        page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
      ).toHaveValue('Two')

      await page
        .getByTestId('field-actions-menu-arrayOfPrimitives')
        .getByTestId('field-actions-trigger')
        .press('Enter')

      await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).press('Enter')

      await expect(page.getByText(`Field "Array of primitives" updated`)).toBeVisible()

      expect(
        page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
      ).toHaveValue('One')

      // $fieldActions = page
      //   .getByTestId('field-actions-menu-arrayOfPrimitives')
      //   .getByTestId('field-actions-trigger')

      // arrayOfPrimitives[0]-menuButton
    })
  })
})
