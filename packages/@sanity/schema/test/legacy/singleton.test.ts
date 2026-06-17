import {expect, test} from 'vitest'

import {Schema} from '../../src/legacy/Schema'

test('singleton: documentId survives schema compilation', () => {
  const schema = new Schema({
    name: 'test',
    types: [
      {
        name: 'settings',
        type: 'document',
        singleton: {documentId: 'settings'},
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })

  const settings = schema.get('settings')
  expect(settings.singleton).toEqual({documentId: 'settings'})
})

test('singleton: a document type without a singleton block has singleton=undefined', () => {
  const schema = new Schema({
    name: 'test',
    types: [
      {
        name: 'article',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })

  const article = schema.get('article')
  expect(article.singleton).toBeUndefined()
})

test('singleton: non-document types do not have a singleton', () => {
  const schema = new Schema({
    name: 'test',
    types: [
      {
        name: 'address',
        type: 'object',
        fields: [{name: 'street', type: 'string'}],
      },
    ],
  })

  const address = schema.get('address')
  expect(address.singleton).toBeUndefined()
})
