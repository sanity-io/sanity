import {type SchemaPluginOptions} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getMockSource} from '../../../../test/testUtils/getMockWorkspaceFromConfig'
import {createStructureBuilder} from '../createStructureBuilder'
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
  ],
}

const CANONICAL_COUNT = {filter: '_type == $type', params: {type: 'author'}}

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

  it('derives the filter from the item schema type, never from the child', () => {
    const serialized = S.documentTypeListItem('book')
      .showCount()
      .child(S.documentTypeList('book'))
      .serialize()

    expect(serialized.count).toEqual({filter: '_type == $type', params: {type: 'book'}})
  })
})
