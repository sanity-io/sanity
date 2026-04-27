/* eslint-disable max-nested-callbacks */
import {type Path, type SanityDocument} from '@sanity/types'
import {beforeEach, describe, expect, it} from 'vitest'
import {page, server} from 'vitest/browser'
import {render} from 'vitest-browser-react'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import CopyPasteStory from './CopyPasteStory'
import {
  CLEANED_UNICODE_INPUT_SNAPSHOT,
  GDOCS_INPUT,
  NORMALIZED_INPUT_SNAPSHOT,
  REMOVED_INPUT_SNAPSHOT,
  UNICODE_TEXT,
} from './input'

export type UpdateFn = () => {focusPath: Path; document: SanityDocument}

async function loadTestFile(relativePath: string): Promise<{
  buffer: ArrayBuffer
  fileName: string
  fileType: string
}> {
  const base64 = await server.commands.readFileAsBase64(relativePath)
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const fileName = relativePath.split('/').pop()!
  // Determine file type from extension
  const ext = fileName.split('.').pop()!
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    zip: 'application/zip',
    pdf: 'application/pdf',
  }
  return {buffer: bytes.buffer, fileName, fileType: mimeTypes[ext] || 'application/octet-stream'}
}

const document: SanityDocument = {
  _id: '123',
  _type: 'test',
  _createdAt: new Date().toISOString(),
  _updatedAt: new Date().toISOString(),
  _rev: '123',
  body: [],
}

describe('Portable Text Input', () => {
  beforeEach(() => {
    window.localStorage.debug = 'sanity-pte:*'
  })

  describe('Should be able to paste from Google Docs and get correct formatting', () => {
    it(`Removed whitespace`, async () => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers()

      render(<CopyPasteStory document={document} />)

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
      expect(documentState?.body?.length || 0).toEqual(snapshotLength)
    })

    it(`Normalized whitespace`, async () => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers()

      render(<CopyPasteStory document={document} />)

      const $pte = await getFocusedPortableTextEditor('field-bodyNormalized')

      await insertPortableTextCopyPaste(GDOCS_INPUT, $pte)

      const documentState = await waitForDocumentState((documentStateValue) => {
        return (documentStateValue?.bodyNormalized?.length || 0) > 0
      })

      // prettier-ignore
      const snapshotLength = NORMALIZED_INPUT_SNAPSHOT.length

      expect(documentState?.bodyNormalized?.length || 0).toEqual(snapshotLength)
    })
  })

  describe('Should be able to paste text that has hidden unicode characters without bloating the PTE', () => {
    it(`Removed unicode characters`, async () => {
      const {getFocusedPortableTextEditor, insertPortableTextCopyPaste, waitForDocumentState} =
        testHelpers()

      render(<CopyPasteStory document={document} />)

      const $pte = await getFocusedPortableTextEditor('field-body')

      await insertPortableTextCopyPaste(UNICODE_TEXT, $pte)

      const documentState = await waitForDocumentState((documentStateValue) => {
        return (documentStateValue?.body?.length || 0) > 0
      })

      // strigify is needed in these cases in order to get the correct length for the content within the children
      // prettier-ignore
      const bodyLength = JSON.stringify(documentState?.body).length || 0
      // prettier-ignore
      const snapshotLength = JSON.stringify(CLEANED_UNICODE_INPUT_SNAPSHOT).length

      // Ideally we would compare the snapshot with the document, but the keys will be different each time
      // We therefore compare the length of the body to the snapshot length here instead.
      expect(bodyLength).toEqual(snapshotLength)
    })
  })

  describe('Should be able to paste files into the PTE', () => {
    it(`Added pasted image as a block`, async () => {
      const {getFocusedPortableTextEditor, pasteFileOverPortableTextEditor} = testHelpers()

      render(<CopyPasteStory document={document} />)

      const fileData = await loadTestFile(
        './static/dummy-image-1.jpg',
      )
      const $pte = await getFocusedPortableTextEditor('field-body')

      await pasteFileOverPortableTextEditor(fileData, $pte)
      await page.getByTestId('upload-destination-sanity-default').click()
      await expect.element($pte.getByTestId('block-preview')).toBeVisible()
    })

    it(`Added dropped image as a block`, async () => {
      const {
        getFocusedPortableTextEditor,
        dropFileOverPortableTextEditor,
        hoverFileOverPortableTextEditor,
      } = testHelpers()

      render(<CopyPasteStory document={document} />)

      const fileData = await loadTestFile(
        './static/dummy-image-1.jpg',
      )
      const $pte = await getFocusedPortableTextEditor('field-body')

      await hoverFileOverPortableTextEditor(fileData, $pte)

      await expect.element(page.getByText('Drop to upload 1 file')).toBeVisible()

      await dropFileOverPortableTextEditor(fileData, $pte)

      await expect.element(page.getByText('Drop to upload 1 file')).not.toBeVisible()

      await page.getByTestId('upload-destination-sanity-default').click()

      await expect.element($pte.getByTestId('block-preview')).toBeVisible()
    })

    it(`Display error message on drag over if file is not accepted`, async () => {
      const {getFocusedPortableTextEditor, hoverFileOverPortableTextEditor} = testHelpers()

      render(<CopyPasteStory document={document} />)

      const fileData = await loadTestFile(
        './static/dummy.zip',
      )
      const $pte = await getFocusedPortableTextEditor('field-body')

      await hoverFileOverPortableTextEditor(fileData, $pte)

      await expect.element(page.getByText(`upload this file here`)).toBeVisible()
    })
  })
})
