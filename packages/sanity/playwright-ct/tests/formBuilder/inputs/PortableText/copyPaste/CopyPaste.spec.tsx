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
