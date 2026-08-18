import {type SanityDocument, type SchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../i18n'
import {IncomingReferencePreview} from '../IncomingReferencePreview'

vi.mock('../../paneItem/PaneItemPreview', () => ({
  PaneItemPreview: vi.fn(({value}) => <div>{value._id}</div>),
}))

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePaneRouter: vi.fn(() => ({
    ChildLink: vi.fn(({childId, childParameters, children}) => (
      <a href="#" data-child-id={childId} data-child-parameters={JSON.stringify(childParameters)}>
        {children}
      </a>
    )),
  })),
}))

vi.mock('../../../../core/store/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(() => []),
}))

const schemaType = {name: 'book', title: 'Book'} as SchemaType
const document = {_id: 'book-id', _type: 'book'} as SanityDocument

async function renderPreview(props: {path?: (string | number | {_key: string})[]}) {
  const wrapper = await createTestProvider({resources: [structureUsEnglishLocaleBundle]})

  render(<IncomingReferencePreview type={schemaType} value={document} {...props} />, {wrapper})

  const link = screen.getByRole('link')
  return JSON.parse(link.getAttribute('data-child-parameters') || '{}')
}

describe('IncomingReferencePreview', () => {
  it('links to the field holding the reference', async () => {
    expect(await renderPreview({path: ['authors', {_key: 'abc'}, 'author']})).toEqual({
      type: 'book',
      path: 'authors[_key=="abc"].author',
    })
  })

  it('links to the document when the reference path could not be resolved', async () => {
    expect(await renderPreview({path: undefined})).toEqual({type: 'book'})
  })

  it('links to the document when the reference path is empty', async () => {
    expect(await renderPreview({path: []})).toEqual({type: 'book'})
  })
})
