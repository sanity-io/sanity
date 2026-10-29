import {type SanityDocument} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {defineConfig} from 'sanity'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {IncomingReferenceDocument} from '../IncomingReferenceDocument'

vi.mock('../../../../../components/incomingReferencesDecoration/IncomingReferencePreview', () => ({
  IncomingReferencePreview: vi.fn(({path}) => (
    <div data-testid="preview" data-path={JSON.stringify(path ?? null)} />
  )),
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [{name: 'author', type: 'reference', to: [{type: 'author'}]}],
      },
      {name: 'author', type: 'document', fields: [{name: 'name', type: 'string'}]},
    ],
  },
})

async function renderDocument(document: SanityDocument, referenceToId: string) {
  const wrapper = await createTestProvider({config, resources: [structureUsEnglishLocaleBundle]})

  render(<IncomingReferenceDocument document={document} referenceToId={referenceToId} />, {wrapper})

  return JSON.parse((await screen.findByTestId('preview')).getAttribute('data-path') || 'null')
}

const book = {
  _id: 'book-id',
  _type: 'book',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  _rev: 'rev',
  author: {_ref: 'author-id', _type: 'reference'},
} satisfies SanityDocument

describe('IncomingReferenceDocument', () => {
  it('passes the path of the referencing field to the preview', async () => {
    expect(await renderDocument(book, 'author-id')).toEqual(['author'])
  })

  it('renders without a path when the document does not hold the reference', async () => {
    // The document we receive from the listener can lag behind, and then holds no reference to
    // the document being inspected. That must not take the inspector down.
    expect(await renderDocument(book, 'some-other-author-id')).toBeNull()
  })
})
