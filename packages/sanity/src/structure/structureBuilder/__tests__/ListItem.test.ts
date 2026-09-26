import {type Schema, type SchemaType} from '@sanity/types'
import {of} from 'rxjs'
import {type SchemaPluginOptions} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
import {type ListItem} from '../ListItem'
import {type StructureBuilder} from '../types'

const mockSchema: SchemaPluginOptions = {
  name: 'mockSchema',
  types: [
    {
      name: 'author',
      title: 'Author',
      type: 'document',
      fields: [{name: 'name', type: 'string'}],
    },
    {
      name: 'book',
      title: 'Book',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
    {
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [{name: 'street', type: 'string'}],
    },
  ],
}

const CANONICAL_COUNT = {type: 'author'}

function getWithheldWarnings(): string[] {
  const warn = vi.mocked(console.warn)
  return warn.mock.calls
    .map(([message]) => String(message))
    .filter((message) => message.includes('showCount() ignored'))
}

describe('ListItemBuilder count descriptor', () => {
  let S: StructureBuilder

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const source = await getMockSource({config: {schema: mockSchema}})
    S = createStructureBuilder({source, perspectiveStack: []})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('omits the descriptor when showCount is not enabled', () => {
    const serialized = S.documentTypeListItem('author').serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([])
  })

  it('emits the canonical descriptor for a plain document type list item', () => {
    const serialized = S.documentTypeListItem('author').showCount().serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('withholds the descriptor for an item with no child at all', () => {
    const serialized = S.listItem().title('Authors').schemaType('author').showCount().serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "authors": it has no child list to agree with'),
    ])
  })

  it('withholds the descriptor when the child pins a non-default api version', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').apiVersion('v1'))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('its child list pins api version "v1"'),
    ])
  })

  it('emits the canonical descriptor when the child is a default document type list', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author'))
      .serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('emits the canonical descriptor when the child only customises menu items', () => {
    const child = S.documentTypeList('author')
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(child.menuItems([...(child.getMenuItems() || [])]))
      .serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('withholds the descriptor when the child filter is narrowed', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').filter('_type == "author" && featured == true'))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "author": its child document list is filtered'),
    ])
  })

  it('withholds the descriptor when the child filter dereferences', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(
        S.documentTypeList('author').filter('_type == "author" && publication->active == true'),
      )
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "author": its child document list is filtered'),
    ])
  })

  it('withholds the descriptor when the child params name another type', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').params({type: 'book'}))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "author": its child document list is filtered'),
    ])
  })

  it('withholds the descriptor when the child carries extra params', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').params({type: 'author', featured: true}))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "author": its child document list is filtered'),
    ])
  })

  it('withholds the descriptor when the child is a custom function', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child((id) => S.documentTypeList(id).filter('featured == true'))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining(
        'list item "author": its child cannot be inspected at serialize time',
      ),
    ])
  })

  it('withholds the descriptor when the child is an observable', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(of(S.documentTypeList('author')))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining(
        'list item "author": its child cannot be inspected at serialize time',
      ),
    ])
  })

  it('withholds the descriptor when the child is an already-serialized filtered list', () => {
    const serialized = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').filter('featured == true').serialize())
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "author": its child document list is filtered'),
    ])
  })

  it('withholds the descriptor when the item resolves no document type', () => {
    const serialized = S.listItem()
      .title('Featured')
      .showCount()
      .child(S.documentTypeList('author').filter('featured == true'))
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "featured": it resolves no document type to count'),
    ])
  })

  it('withholds the descriptor for a nested list child', () => {
    const serialized = S.listItem()
      .title('Settings')
      .showCount()
      .child(
        S.list()
          .title('Settings')
          .items([S.documentTypeListItem('author')]),
      )
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "settings": it resolves no document type to count'),
    ])
  })

  it('names the item schema type, never anything taken from the child', () => {
    const serialized = S.documentTypeListItem('book')
      .showCount()
      .child(S.documentTypeList('book'))
      .serialize()

    expect(serialized.count).toEqual({type: 'book'})
  })

  it('withholds the descriptor when the schema type is an object rather than a document', () => {
    const serialized = S.listItem()
      .title('Address')
      .id('address')
      .schemaType('address')
      .showCount()
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "address": it resolves no document type to count'),
    ])
  })

  it('withholds the descriptor when the schema type is re-pointed away from the branded child', () => {
    const serialized = S.documentTypeListItem('author').schemaType('book').showCount().serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining(
        'list item "author": its child lists "author" while the item counts "book"',
      ),
    ])
  })

  it('withholds the descriptor when the branded child is transplanted onto a differently-typed item', () => {
    const serialized = S.listItem()
      .id('books')
      .title('Books')
      .schemaType('book')
      .child(S.documentTypeListItem('author').getChild()!)
      .showCount()
      .serialize()

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining(
        'list item "books": its child lists "author" while the item counts "book"',
      ),
    ])
  })

  it('emits the canonical descriptor for a plain document type list item with a customised title', () => {
    const serialized = S.documentTypeListItem('author').title('Authors').showCount().serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('emits the canonical descriptor for a plain document type list item with a customised id', () => {
    const serialized = S.documentTypeListItem('author').id('authors').showCount().serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('emits the canonical descriptor for a plain document type list item with a customised icon', () => {
    const serialized = S.documentTypeListItem('author')
      .icon(() => null)
      .showCount()
      .serialize()

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })
})

describe('raw list item count descriptor', () => {
  let S: StructureBuilder
  let schema: Schema

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const source = await getMockSource({config: {schema: mockSchema}})
    schema = source.schema
    S = createStructureBuilder({source, perspectiveStack: []})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function serializeRawItem(item: ListItem): ListItem {
    const [serialized] = S.list().id('root').title('Root').items([item]).serialize().items
    return serialized as ListItem
  }

  function authorType(): SchemaType {
    return schema.get('author') as SchemaType
  }

  it('drops an authored count when the raw item never asked to show one', () => {
    const serialized = serializeRawItem({
      id: 'authors',
      type: 'listItem',
      title: 'Authors',
      schemaType: authorType(),
      count: {type: 'book'},
    })

    expect(serialized.count).toBeUndefined()
  })

  it('re-derives the count from the raw item schema type, ignoring the authored one', () => {
    const serialized = serializeRawItem({
      id: 'authors',
      type: 'listItem',
      title: 'Authors',
      schemaType: authorType(),
      child: S.documentTypeList('author').serialize(),
      displayOptions: {showCount: true},
      count: {type: 'book'},
    })

    expect(serialized.count).toEqual(CANONICAL_COUNT)
  })

  it('emits the canonical descriptor for a legitimate raw item', () => {
    const serialized = serializeRawItem({
      id: 'authors',
      type: 'listItem',
      title: 'Authors',
      schemaType: authorType(),
      child: S.documentTypeList('author').serialize(),
      displayOptions: {showCount: true},
    })

    expect(serialized.count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('withholds the count when the raw item resolves no document type', () => {
    const serialized = serializeRawItem({
      id: 'featured',
      type: 'listItem',
      title: 'Featured',
      displayOptions: {showCount: true},
      count: {type: 'author'},
    })

    expect(serialized.count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('list item "featured": it resolves no document type to count'),
    ])
  })
})

describe('serialized list item re-entering a list', () => {
  let S: StructureBuilder
  let schema: Schema

  beforeEach(async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const source = await getMockSource({config: {schema: mockSchema}})
    schema = source.schema
    S = createStructureBuilder({source, perspectiveStack: []})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function reinsert(item: ListItem): ListItem {
    const [serialized] = S.list().id('root').title('Root').items([item]).serialize().items
    return serialized as ListItem
  }

  it('keeps the count when a branded default child is serialized then re-inserted', () => {
    const once = S.documentTypeListItem('author').showCount().serialize()

    expect(reinsert(once).count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('keeps the count when an unfiltered document list child is serialized then re-inserted', () => {
    const once = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author'))
      .serialize()

    expect(reinsert(once).count).toEqual(CANONICAL_COUNT)
    expect(getWithheldWarnings()).toEqual([])
  })

  it('still withholds the count when a filtered document list child is re-inserted', () => {
    const once = S.documentTypeListItem('author')
      .showCount()
      .child(S.documentTypeList('author').filter('_type == $type && featured == true'))
      .serialize()

    expect(once.count).toBeUndefined()
    expect(reinsert(once).count).toBeUndefined()
  })

  it('still withholds the count when a re-inserted branded child lists another type', () => {
    const once = S.documentTypeListItem('author').showCount().serialize()
    const transplanted = {...once, schemaType: schema.get('book') as SchemaType}

    expect(reinsert(transplanted).count).toBeUndefined()
    expect(getWithheldWarnings()).toEqual([
      expect.stringContaining('its child lists "author" while the item counts "book"'),
    ])
  })
})
