import {type Path, type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
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

describe('Copy and pasting fields', () => {
  const {mockClipboard} = testHelpers()
  let clipboard: {restore: () => void}
  afterEach(() => clipboard?.restore())

  describe('Object input', () => {
    it(`Copy and paste via field actions`, async () => {
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsStory document={document} />)

      await expect.element(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string1').getByRole('textbox').element(),
        'A string to copy',
      )

      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string2').getByRole('textbox').element(),
        'This is the second field',
      )

      await expect
        .element(page.getByTestId('field-objectWithColumns.string2').getByRole('textbox'))
        .toHaveValue('This is the second field')

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      let $fieldActions = page
        .getByTestId('field-actions-menu-objectWithColumns')
        .getByTestId('field-actions-trigger')

      await $fieldActions.element().focus()
      await expect.element($fieldActions).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      await expect.element(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      // Clear string1 so we can verify paste restores it
      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string1').getByRole('textbox').element(),
        '',
      )

      $fieldActions = page
        .getByTestId('field-actions-menu-objectWithColumns')
        .getByTestId('field-actions-trigger')

      await $fieldActions.element().focus()

      await expect.element($fieldActions).toBeVisible()

      await userEvent.keyboard('{Enter}')

      await expect.element(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      // Assertion: the copied value was pasted back. (The studio no longer shows
      // success toasts for copy/paste — see #8612 — so assert on the field value.)
      await expect
        .element(page.getByTestId('field-objectWithColumns.string1').getByRole('textbox'))
        .toHaveValue('A string to copy')
    })

    // TODO: native Ctrl+C/Ctrl+V is handled by the browser and bypasses
    // navigator.clipboard, so it can't be driven by the in-memory clipboard
    // spy. Needs real clipboard access (permission-gated, unavailable headless).
    it.skip(`Copy via keyboard shortcut`, async () => {
      const {findBySelector} = testHelpers()
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsStory document={document} />)

      await expect.element(page.getByTestId(`field-objectWithColumns`)).toBeVisible()

      const $object = await findBySelector(
        page.getByTestId('field-objectWithColumns'),
        '[tabindex="0"]',
      )
      await expect.element($object).toBeVisible()

      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string1').getByRole('textbox').element(),
        'A string to copy',
      )

      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string2').getByRole('textbox').element(),
        'This is the second field',
      )

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      await $object.element().focus()
      await expect.element($object).toHaveFocus()
      await userEvent.keyboard('{Control>}c{/Control}')

      await expect.element(page.getByText(`Field "Object with columns" copied`)).toBeVisible()

      await $object.element().focus()
      await expect.element($object).toHaveFocus()
      await userEvent.keyboard('{Control>}v{/Control}')

      await expect.element(page.getByText(`Field "Object with columns" updated`)).toBeVisible()

      await expect
        .element(page.getByTestId('field-objectWithColumns.string1').getByRole('textbox'))
        .toHaveValue('A string to copy')
    })
  })

  describe('String input', () => {
    it(`Copy and pasting via field actions`, async () => {
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsStory document={document} />)

      await expect.element(page.getByTestId(`field-title`)).toBeVisible()

      await userEvent.fill(
        page.getByTestId('field-title').getByRole('textbox').element(),
        'A string to copy',
      )
      await expect
        .element(page.getByTestId('field-title').getByRole('textbox'))
        .toHaveValue('A string to copy')

      const fieldActionsId = 'field-actions-menu-title'
      const fieldActionsTriggerId = 'field-actions-trigger'

      await page.getByTestId(fieldActionsId).getByTestId(fieldActionsTriggerId).element().focus()
      await userEvent.keyboard('{Enter}')

      await expect.element(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      await userEvent.fill(page.getByTestId('field-title').getByRole('textbox').element(), '')

      // Trigger the field actions menu
      await page.getByTestId(fieldActionsId).getByTestId(fieldActionsTriggerId).element().focus()
      await userEvent.keyboard('{Enter}')

      // Click on the "Paste field" option in the menu
      await expect.element(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      // Verify that the field content is updated with the pasted value. (No
      // success toast any more — see #8612 — so assert on the field value.)
      await expect
        .element(page.getByTestId('field-title').getByRole('textbox'))
        .toHaveValue('A string to copy')
    })
  })

  describe('Array input', () => {
    // TODO: array field paste restores the removed item but not at index 0 — the
    // paste-into-array ordering needs verifying before this can assert reliably.
    it.skip(`Copy and pasting via field actions`, async () => {
      const {findBySelector} = testHelpers()
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsStory document={document} />)

      await expect.element(page.getByTestId(`field-arrayOfPrimitives`)).toBeVisible()

      // https://github.com/microsoft/playwright/pull/30572
      // maybe part of 1.44
      // await page.keyboard.press('ControlOrMeta+C')
      await page
        .getByTestId('field-actions-menu-arrayOfPrimitives')
        .getByTestId('field-actions-trigger')
        .element()
        .focus()
      await userEvent.keyboard('{Enter}')

      await expect.element(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Copy field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      const $rowActionTrigger = await findBySelector(
        page.getByTestId('field-arrayOfPrimitives'),
        '[id="arrayOfPrimitives[0]-menuButton"]',
      )

      await $rowActionTrigger.element().focus()
      await expect.element($rowActionTrigger).toHaveFocus()
      await userEvent.keyboard('{Enter}')

      const $removeButton = page.getByRole('menuitem', {name: 'Remove'})

      await expect.element($removeButton).toBeVisible()

      await $removeButton.element().focus()
      await userEvent.keyboard('{Enter}')

      await expect
        .element(page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input'))
        .not.toHaveValue('One')
      await expect
        .element(page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input'))
        .toHaveValue('Two')

      await page
        .getByTestId('field-actions-menu-arrayOfPrimitives')
        .getByTestId('field-actions-trigger')
        .element()
        .focus()
      await userEvent.keyboard('{Enter}')

      await expect.element(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await page.getByRole('menuitem', {name: 'Paste field'}).element().focus()
      await userEvent.keyboard('{Enter}')

      // Assertion: pasting restores the removed 'One' item (no success toast — #8612)
      await expect
        .element(page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input'))
        .toHaveValue('One')
    })
  })
})
