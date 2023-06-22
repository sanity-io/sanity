import {test as base} from '@playwright/test'
import {SanityDocument} from 'sanity'
import {SanityDocumentStub} from '@sanity/client'
import {createUniqueDocument, deleteSingleDocument} from '../helpers'

// Example of possible fixtures we can use in tests

type DocumentFixture = {
  createDocument: (document: SanityDocumentStub) => Promise<Partial<SanityDocument>>
  deleteDocument: (docId: string) => Promise<SanityDocument>
}

export const test = base.extend<DocumentFixture>({
  createDocument: async ({page}, use) => {
    await use(async (sanityDocument: SanityDocumentStub) => {
      const document = await createUniqueDocument(sanityDocument)
      return document
    })
  },
  deleteDocument: async ({page}, use) => {
    await use(async (docId: string) => {
      const document = await deleteSingleDocument(docId)
      return document
    })
  },
})

export {expect} from '@playwright/test'
