/* eslint-disable max-nested-callbacks */
import {expect, test} from '@playwright/experimental-ct-react'
import {Path, SanityDocument} from '@sanity/types'
import {Page} from '@playwright/test'
import CopyPasteStory from './CopyPasteStory'
import {testHelpers} from '../../../../utils/testHelpers'
import {GDOCS_INPUT, NORMALIZED_INPUT_SNAPSHOT, REMOVED_INPUT_SNAPSHOT} from './input'

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
})
