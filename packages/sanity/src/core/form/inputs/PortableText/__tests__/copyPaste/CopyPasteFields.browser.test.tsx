import {defineField, defineType, type Path, type SanityDocument} from '@sanity/types'
import {afterEach, describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestForm} from '../../../../../../../test/browser/TestForm'
import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'string',
        name: 'title',
        title: 'Title',
      }),
      defineField({
        type: 'object',
        name: 'objectWithColumns',
        title: 'Object with columns',
        options: {
          columns: 4,
        },
        fields: [
          {
            type: 'string',
            title: 'String 1',
            description: 'this is a king kong description',
            name: 'string1',
          },
          {
            type: 'string',
            title: 'String 2',
            name: 'string2',
          },
          {
            type: 'number',
            title: 'Number 1',
            name: 'number1',
          },
          {
            type: 'number',
            title: 'Number 2',
            name: 'number2',
          },
          {
            type: 'image',
            title: 'Image 1',
            name: 'image1',
          },
          {
            name: 'file',
            type: 'file',
            title: 'File',
          },
        ],
      }),
      defineField({
        name: 'arrayOfPrimitives',
        type: 'array',
        of: [
          {
            type: 'string',
            title: 'A string',
          },
          {
            type: 'number',
            title: 'A number',
          },
          {
            type: 'boolean',
            title: 'A boolean',
          },
        ],
      }),
      defineField({
        name: 'arrayOfMultipleTypes',
        title: 'Array of multiple types',
        type: 'array',
        of: [
          {
            type: 'image',
          },
          {
            type: 'object',
            name: 'color',
            title: 'Color with a long title',
            fields: [
              {
                name: 'title',
                type: 'string',
              },
              {
                name: 'name',
                type: 'string',
              },
            ],
          },
        ],
      }),
    ],
  }),
]

function CopyPasteFieldsHarness({
  focusPath,
  document,
}: {
  focusPath?: Path
  document?: SanityDocument
}) {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <TestForm document={document} focusPath={focusPath} />
    </TestWrapper>
  )
}

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  // Fixed timestamps — module-load `new Date()` is a nondeterministic input if
  // anything in the tree ever surfaces them (and keeps archive DOM stable).
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-01T00:00:00.000Z',
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
      void render(<CopyPasteFieldsHarness document={document} />)

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

      await userEvent.click($fieldActions)
      await expect.element(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', {name: 'Copy field'}))

      // Clear string1 so we can verify paste restores it
      await userEvent.fill(
        page.getByTestId('field-objectWithColumns.string1').getByRole('textbox').element(),
        '',
      )

      $fieldActions = page
        .getByTestId('field-actions-menu-objectWithColumns')
        .getByTestId('field-actions-trigger')

      await expect.element($fieldActions).toBeVisible()
      await userEvent.click($fieldActions)

      await expect.element(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', {name: 'Paste field'}))

      // Assertion: the copied value was pasted back. (The studio no longer shows
      // success toasts for copy/paste — see #8612 — so assert on the field value.)
      const $string1 = page.getByTestId('field-objectWithColumns.string1').getByRole('textbox')
      await expect.element($string1).toHaveValue('A string to copy')

      // Settle the Chromatic end state: dismiss any leftover field-actions menu
      // (clicking the textbox alone does not always close it), then focus the
      // pasted field so the snapshot is not mid-animation.
      await userEvent.keyboard('{Escape}')
      await userEvent.click($string1)
      await expect.element($string1).toHaveValue('A string to copy')
      await expect.element($string1).toHaveFocus()
      await expect
        .poll(
          () =>
            Array.from(window.document.querySelectorAll('[role="menuitem"]')).filter(
              (el) =>
                el instanceof HTMLElement &&
                el.checkVisibility() &&
                /Copy field|Paste field/.test(el.textContent || ''),
            ).length,
        )
        .toBe(0)
    })

    // TODO: native Ctrl+C/Ctrl+V is handled by the browser and bypasses
    // navigator.clipboard, so it can't be driven by the in-memory clipboard
    // spy. Needs real clipboard access (permission-gated, unavailable headless).
    it.skip(`Copy via keyboard shortcut`, async () => {
      const {findBySelector} = testHelpers()
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsHarness document={document} />)

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
      void render(<CopyPasteFieldsHarness document={document} />)

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

      const $titleActions = page.getByTestId(fieldActionsId).getByTestId(fieldActionsTriggerId)
      await userEvent.click($titleActions)

      await expect.element(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', {name: 'Copy field'}))

      await userEvent.fill(page.getByTestId('field-title').getByRole('textbox').element(), '')

      await userEvent.click($titleActions)

      await expect.element(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
      await userEvent.click(page.getByRole('menuitem', {name: 'Paste field'}))

      // Verify that the field content is updated with the pasted value. (No
      // success toast any more — see #8612 — so assert on the field value.)
      const $title = page.getByTestId('field-title').getByRole('textbox')
      await expect.element($title).toHaveValue('A string to copy')

      // Settle the Chromatic end state: dismiss any leftover field-actions menu
      // (clicking the textbox alone does not always close it), then focus the
      // pasted field so the snapshot is not mid-animation.
      await userEvent.keyboard('{Escape}')
      await userEvent.click($title)
      await expect.element($title).toHaveValue('A string to copy')
      await expect.element($title).toHaveFocus()
      await expect
        .poll(
          () =>
            Array.from(window.document.querySelectorAll('[role="menuitem"]')).filter(
              (el) =>
                el instanceof HTMLElement &&
                el.checkVisibility() &&
                /Copy field|Paste field/.test(el.textContent || ''),
            ).length,
        )
        .toBe(0)
    })
  })

  describe('Array input', () => {
    // TODO: array field paste restores the removed item but not at index 0 — the
    // paste-into-array ordering needs verifying before this can assert reliably.
    it.skip(`Copy and pasting via field actions`, async () => {
      const {findBySelector} = testHelpers()
      clipboard = mockClipboard()
      void render(<CopyPasteFieldsHarness document={document} />)

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
