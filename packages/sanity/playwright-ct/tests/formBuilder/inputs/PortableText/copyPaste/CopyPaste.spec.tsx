/* eslint-disable max-nested-callbacks */
import path from 'node:path'

// import {expect, test} from '@playwright/experimental-ct-react'
import {type Path, type SanityDocument} from '@sanity/types'

import {expect, test} from '../../../../fixtures'
import {testHelpers} from '../../../../utils/testHelpers'
import CopyPasteStory from './CopyPasteStory'
import {
  CLEANED_UNICODE_INPUT_SNAPSHOT,
  GDOCS_INPUT,
  NORMALIZED_INPUT_SNAPSHOT,
  REMOVED_INPUT_SNAPSHOT,
  UNICODE_TEXT,
} from './input'

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [],
  arrayOfPrimitives: ['One', 'Two', true],
  arrayOfMultipleTypes: [
    {
      _key: '6724abb6eee4',
      _type: 'color',
      title: 'Alright, testing this. Testing this as well tresting to typing here ee e',
    },
    {
      _key: 'b361e6162fcc',
      _type: 'book',
      reviewsInline: [
        {
          _key: '0f1e4ae3c464',
          _type: 'review',
          title: 'Okay',
        },
      ],
      title: 'Foo! bar hello iam typing testing to type i am testing to type in this dialog',
    },
  ],
}

test.describe('Portable Text Input', () => {
  test.beforeEach(async ({page, browserName}) => {
    test.skip(browserName === 'webkit', 'Currently not working in Webkit')
    await page.evaluate(() => {
      window.localStorage.debug = 'sanity-pte:*'
    })
  })
  test.describe('Should be able to paste from Google Docs and get correct formatting', () => {
    test(`Removed whitespace`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableTextCopyPaste(GDOCS_INPUT, $pte)

      const documentState = await waitForDocumentState((documentStateValue) => {
        return (documentStateValue?.body?.length || 0) > 0
      })

      // prettier-ignore
      const snapshotLength = REMOVED_INPUT_SNAPSHOT.length

      // Ideally we would compare the snapshot with the document, but the keys will be different each time
      // This isn't easy to fix, since we can't mock the randomKey generator, due to missing support in Playwright
      // We therefore compare the length of the body to the snapshot length here instead.
      // This will make sure we don't have extra whitespace blocks
      await expect(documentState?.body?.length || 0).toEqual(snapshotLength)
    })
    test(`Normalized whitespace`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const $pte = await getFocusedPortableTextEditor('field-bodyNormalized')

      await insertPortableTextCopyPaste(GDOCS_INPUT, $pte)

      const documentState = await waitForDocumentState((documentStateValue) => {
        return (documentStateValue?.bodyNormalized?.length || 0) > 0
      })

      // prettier-ignore
      const snapshotLength = NORMALIZED_INPUT_SNAPSHOT.length

      await expect(documentState?.bodyNormalized?.length || 0).toEqual(snapshotLength)
    })
  })

  test.describe('Should be able to paste text that has hidden unicode characters without bloating the PTE', () => {
    test(`Removed unicode characters`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableTextCopyPaste(UNICODE_TEXT, $pte)

      const documentState = await waitForDocumentState((documentStateValue) => {
        return (documentStateValue?.body?.length || 0) > 0
      })

      // strigify is needed in these cases in order to get the correct length for the content within the children
      // prettier-ignore
      const bodyLength = await JSON.stringify(documentState?.body).length || 0
      // prettier-ignore
      const snapshotLength = JSON.stringify(CLEANED_UNICODE_INPUT_SNAPSHOT).length

      // Ideally we would compare the snapshot with the document, but the keys will be different each time
      // We therefore compare the length of the body to the snapshot length here instead.
      await expect(bodyLength).toEqual(snapshotLength)
    })
  })

  test.describe('Should be able to paste files into the PTE', () => {
    test(`Added pasted image as a block`, async ({browserName, mount, page}) => {
      test.skip(browserName === 'firefox', 'Currently not working in Firefox')
      const {getFocusedPortableTextEditor, pasteFileOverPortableTextEditor} = testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const imagePath = path.resolve(__dirname, 'static', 'dummy-image-1.jpg')
      const $pte = await getFocusedPortableTextEditor('field-body')

      await pasteFileOverPortableTextEditor(imagePath, 'image/jpeg', $pte)

      await expect($pte.getByTestId('block-preview')).toBeVisible()
    })
    test(`Added dropped image as a block`, async ({mount, page}) => {
      const {
        getFocusedPortableTextEditor,
        dropFileOverPortableTextEditor,
        hoverFileOverPortableTextEditor,
      } = testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const imagePath = path.resolve(__dirname, 'static', 'dummy-image-1.jpg')
      const $pte = await getFocusedPortableTextEditor('field-body')

      await hoverFileOverPortableTextEditor(imagePath, 'image/jpeg', $pte)

      await expect(page.getByText('Drop to upload 1 file')).toBeVisible()

      await dropFileOverPortableTextEditor(imagePath, 'image/jpeg', $pte)

      await expect(page.getByText('Drop to upload 1 file')).not.toBeVisible()

      await expect($pte.getByTestId('block-preview')).toBeVisible()
    })
    test(`Display error message on drag over if file is not accepted`, async ({mount, page}) => {
      const {getFocusedPortableTextEditor, hoverFileOverPortableTextEditor} = testHelpers({page})

      await mount(<CopyPasteStory document={document} />)

      const zipPath = path.resolve(__dirname, 'static', 'dummy.zip')
      const $pte = await getFocusedPortableTextEditor('field-body')

      await hoverFileOverPortableTextEditor(zipPath, 'application/zip', $pte)

      await expect(page.getByText(`upload this file here`)).toBeVisible()
    })
  })
})

test.describe('Object input', () => {
  test(`Copy and paste via field actions`, async ({
    browserName,
    getClipboardItemsAsText,
    mount,
    page,
  }) => {
    await mount(<CopyPasteStory document={document} />)

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
    let $fieldActions = page
      .getByTestId('field-actions-menu-objectWithColumns')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Copy field'}).click()

    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

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

    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Paste field'}).click()

    await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()

    await expect(page.getByTestId('field-objectWithColumns.string1').locator('input')).toHaveValue(
      'A string to copy',
    )
  })

  test(`Copy via keyboard shortcut`, async ({
    browserName,
    getClipboardItemsAsText,
    mount,
    page,
  }) => {
    await mount(<CopyPasteStory document={document} />)

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

    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Object with columns copied`)).toBeVisible()

    // Check that the plain text version is set
    await expect(await getClipboardItemsAsText()).toContain('A string to copy')
    await expect(await getClipboardItemsAsText()).toContain('This is the second field')

    await $object.focus()
    await expect($object).toBeFocused()
    await $object.press('ControlOrMeta+V')

    await expect(page.getByText(`Field Object with columns updated`)).toBeVisible()

    await expect(page.getByTestId('field-objectWithColumns.string1').locator('input')).toHaveValue(
      'A string to copy',
    )
  })
})

test.describe('String input', () => {
  test(`Copy and pasting via field actions`, async ({
    browserName,
    getClipboardItemsAsText,
    mount,
    page,
  }) => {
    await mount(<CopyPasteStory document={document} />)

    await expect(page.getByTestId(`field-title`)).toBeVisible()

    await page.getByTestId('field-title').locator('input').fill('A string to copy')

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    let $fieldActions = page
      .getByTestId('field-actions-menu-title')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Copy field'}).click()

    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Title copied`)).toBeVisible()

    // Check that the plain text version is set
    await expect(await getClipboardItemsAsText()).toContain('A string to copy')

    // Trigger the field actions menu
    $fieldActions = page
      .getByTestId('field-actions-menu-title')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    // Click on the "Paste field" option in the menu
    await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Paste field'}).click()

    // Verify that the field content is updated with the pasted value
    await expect(page.getByText(`Field Title updated`)).toBeVisible()
    await expect(page.getByTestId('field-title').locator('input')).toHaveValue('A string to copy')
  })
})

test.describe('Array input', () => {
  test(`Copy and pasting via field actions`, async ({
    browserName,
    getClipboardItemsAsText,
    mount,
    page,
  }) => {
    await mount(<CopyPasteStory document={document} />)

    await expect(page.getByTestId(`field-arrayOfPrimitives`)).toBeVisible()

    // https://github.com/microsoft/playwright/pull/30572
    // maybe part of 1.44
    // await page.keyboard.press('ControlOrMeta+C')
    const $fieldActions = page
      .getByTestId('field-actions-menu-arrayOfPrimitives')
      .getByTestId('field-actions-trigger')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Copy field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Copy field'}).click()

    if (browserName === 'firefox') {
      await expect(page.getByText(`Your browser doesn't support this action (yet)`)).toBeVisible()

      return
    }

    await expect(page.getByText(`Field Array of primitives copied`)).toBeVisible()

    // Check that the plain text version is set
    await expect(await getClipboardItemsAsText()).toContain('One, Two')

    const $rowActionTrigger = page.locator('[id="arrayOfPrimitives[0]-menuButton"]')

    await $rowActionTrigger.focus()
    await expect($rowActionTrigger).toBeFocused()
    await $rowActionTrigger.click()

    const $removeButton = page.getByRole('menuitem', {name: 'Remove'}).first()

    await expect($removeButton).toBeVisible()

    await $removeButton.click()

    expect(
      page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
    ).not.toHaveValue('One')
    expect(
      page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
    ).toHaveValue('Two')

    await $fieldActions.focus()
    await expect($fieldActions).toBeFocused()
    await $fieldActions.click()

    await expect(page.getByRole('menuitem', {name: 'Paste field'})).toBeVisible()
    await page.getByRole('menuitem', {name: 'Paste field'}).click()

    await expect(page.getByText(`Field Array of primitives updated`)).toBeVisible()

    expect(
      page.getByTestId(`field-arrayOfPrimitives`).getByTestId('string-input').first(),
    ).toHaveValue('One')

    // $fieldActions = page
    //   .getByTestId('field-actions-menu-arrayOfPrimitives')
    //   .getByTestId('field-actions-trigger')

    // arrayOfPrimitives[0]-menuButton
  })
})
