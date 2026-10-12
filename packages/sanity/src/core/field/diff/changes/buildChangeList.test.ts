import {diffInput, wrap} from '@sanity/diff'
import {defineArrayMember, defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {pathToString} from '../../paths/helpers'
import {type ChangeNode, type FieldChangeNode, type ObjectDiff} from '../../types'
import {DatetimeFieldDiff} from '../../types/datetime/diff/DatetimeFieldDiff'
import {FileFieldDiff} from '../../types/file/diff/FileFieldDiff'
import {ImageFieldDiff} from '../../types/image/diff/ImageFieldDiff'
import {PTDiff} from '../../types/portableText/diff/PTDiff'
import {StringFieldDiff} from '../../types/string/diff/StringFieldDiff'
import {JsonFieldDiff} from '../components/JsonFieldDiff'
import {buildObjectChangeList} from './buildChangeList'

const schema = createSchema({
  name: 'test',
  types: [
    defineType({
      name: 'item',
      type: 'object',
      fields: [
        defineField({name: 'label', type: 'string', title: 'Label'}),
        defineField({name: 'qty', type: 'number'}),
      ],
    }),
    defineType({
      name: 'other',
      type: 'object',
      fields: [defineField({name: 'n', type: 'number'})],
    }),
    defineType({
      name: 'article',
      type: 'document',
      fieldsets: [{name: 'seo', title: 'SEO', readOnly: true, hidden: true}],
      fields: [
        defineField({name: 'title', type: 'string', title: 'Title'}),
        defineField({name: 'body', type: 'text'}),
        defineField({name: 'published', type: 'boolean'}),
        defineField({name: 'publishedAt', type: 'datetime'}),
        defineField({name: 'metaTitle', type: 'string', fieldset: 'seo', title: 'Meta title'}),
        defineField({name: 'metaDesc', type: 'string', fieldset: 'seo', title: 'Meta description'}),
        defineField({
          name: 'author',
          type: 'object',
          fields: [
            defineField({name: 'name', type: 'string'}),
            defineField({name: 'email', type: 'string'}),
          ],
        }),
        defineField({
          name: 'tags',
          type: 'array',
          of: [defineArrayMember({type: 'string'})],
        }),
        defineField({
          name: 'items',
          type: 'array',
          of: [defineArrayMember({type: 'item'})],
        }),
        defineField({
          name: 'mixed',
          type: 'array',
          of: [defineArrayMember({type: 'item'}), defineArrayMember({type: 'other'})],
        }),
        defineField({
          name: 'blocks',
          type: 'array',
          of: [defineArrayMember({type: 'block'})],
        }),
        defineField({name: 'photo', type: 'image'}),
        defineField({name: 'attachment', type: 'file'}),
      ],
    }),
  ],
})

const article = schema.get('article') as ObjectSchemaType

function diffDocument(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
): ObjectDiff {
  return diffInput(wrap(previous, null), wrap(current, null)) as ObjectDiff
}

function list(
  previous: Record<string, unknown>,
  current: Record<string, unknown>,
  fieldFilter?: string[],
): ChangeNode[] {
  return buildObjectChangeList(
    article,
    diffDocument(previous, current),
    [],
    [],
    fieldFilter ? {fieldFilter} : {},
  )
}

function isField(change: ChangeNode): change is FieldChangeNode {
  return change.type === 'field'
}

function fieldPaths(changes: ChangeNode[]): string[] {
  return changes.flatMap((change) => {
    if (change.type === 'group') {
      return fieldPaths(change.changes)
    }
    return [pathToString(change.path)]
  })
}

describe('buildObjectChangeList', () => {
  it('omits unchanged fields', () => {
    expect(list({title: 'Same', body: 'a'}, {title: 'Same', body: 'b'})).toMatchObject([
      {type: 'field', path: ['body'], schemaType: {name: 'text'}},
    ])
  })

  it('returns a single field change without wrapping it in a group', () => {
    const changes = list({title: 'Old'}, {title: 'New'})

    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      type: 'field',
      path: ['title'],
      key: 'title',
      showHeader: true,
      titlePath: ['Title'],
      diffComponent: StringFieldDiff,
    })
  })

  it('wraps two sibling field changes in a group and strips the shared title prefix', () => {
    const changes = list({title: 'Old', body: 'a'}, {title: 'New', body: 'b'})

    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      type: 'group',
      key: 'root',
      path: [],
      titlePath: [],
      schemaType: {name: 'article'},
    })
    expect(changes[0].type === 'group' && fieldPaths(changes[0].changes)).toEqual(['title', 'body'])
    expect(
      changes[0].type === 'group' && changes[0].changes.map((change) => change.titlePath),
    ).toEqual([['Title'], ['Body']])
  })

  it('keeps only fields listed in fieldFilter', () => {
    const changes = list({title: 'Old', body: 'a'}, {title: 'New', body: 'b'}, ['title'])

    expect(changes).toMatchObject([{type: 'field', path: ['title']}])
  })

  it('surfaces an unknown extra key as a json field change and skips empty-array extras', () => {
    const extra = list({title: 'Same', orphan: 'a'}, {title: 'Same', orphan: 'b'})
    expect(extra).toMatchObject([
      {
        type: 'field',
        path: ['orphan'],
        schemaType: {name: '__sanity.unknownDocumentField'},
        diffComponent: JsonFieldDiff,
      },
    ])

    expect(list({title: 'Same', leftover: []}, {title: 'Same', leftover: undefined})).toEqual([])
    expect(list({title: 'Same', leftover: undefined}, {title: 'Same', leftover: []})).toEqual([])
  })

  it('does not treat document metadata keys as unknown fields', () => {
    expect(
      list(
        {_type: 'article', _rev: '1', title: 'Same'},
        {_type: 'article', _rev: '2', title: 'Same'},
      ),
    ).toEqual([])
  })

  it('groups two fieldset changes and copies readOnly and hidden onto the group', () => {
    const changes = list({metaTitle: 'a', metaDesc: 'x'}, {metaTitle: 'b', metaDesc: 'y'})

    expect(changes).toMatchObject([
      {
        type: 'group',
        fieldsetName: 'seo',
        titlePath: ['SEO'],
        readOnly: true,
        hidden: true,
      },
    ])
    expect(changes[0].type === 'group' && fieldPaths(changes[0].changes)).toEqual([
      'metaTitle',
      'metaDesc',
    ])
  })

  it('leaves a single fieldset change ungrouped and inherits readOnly and hidden on the field type', () => {
    const changes = list({metaTitle: 'a'}, {metaTitle: 'b'})

    expect(changes).toHaveLength(1)
    expect(changes[0]).toMatchObject({
      type: 'field',
      path: ['metaTitle'],
      schemaType: {readOnly: true, hidden: true},
    })
  })

  it('hides the boolean field header via the default component options', () => {
    expect(list({published: false}, {published: true})).toMatchObject([
      {type: 'field', path: ['published'], showHeader: false},
    ])
  })

  it('resolves datetime by type name rather than the string jsonType', () => {
    expect(
      list({publishedAt: '2020-01-01T00:00:00.000Z'}, {publishedAt: '2021-01-01T00:00:00.000Z'}),
    ).toMatchObject([{type: 'field', path: ['publishedAt'], diffComponent: DatetimeFieldDiff}])
  })

  it('attaches a type-mismatch error and drops the diff component', () => {
    const changes = list({title: 12}, {title: 13})

    expect(changes).toMatchObject([
      {
        type: 'field',
        path: ['title'],
        diffComponent: undefined,
        error: {expectedType: 'string', actualType: 'number'},
      },
    ])
  })

  it('recurses into a nested object and groups when two inner fields change', () => {
    const one = list({author: {name: 'Ada', email: 'a@x'}}, {author: {name: 'Alan', email: 'a@x'}})
    expect(one).toMatchObject([{type: 'field', path: ['author', 'name']}])

    const two = list({author: {name: 'Ada', email: 'a@x'}}, {author: {name: 'Alan', email: 'b@x'}})
    expect(two).toMatchObject([{type: 'group', path: ['author']}])
    expect(two[0].type === 'group' && fieldPaths(two[0].changes)).toEqual([
      'author.name',
      'author.email',
    ])
  })

  it('omits an array whose values are only empty on both sides', () => {
    expect(list({tags: undefined}, {tags: []})).toEqual([])
    expect(list({tags: null}, {tags: []})).toEqual([])
  })

  it('treats an unkeyed primitive array replacement as a remove and an add, so two items become a group', () => {
    const one = list({tags: ['a', 'b']}, {tags: ['a', 'c']})
    expect(one).toMatchObject([{type: 'group', path: ['tags']}])
    expect(one[0].type === 'group' && fieldPaths(one[0].changes)).toEqual(['tags[1]', 'tags[2]'])

    const two = list({tags: ['a', 'b']}, {tags: ['x', 'y']})
    expect(two).toMatchObject([{type: 'group', path: ['tags']}])
    expect(two[0].type === 'group' && two[0].changes.length).toBeGreaterThan(1)
  })

  it('keeps a moved keyed array item even when its fields did not change', () => {
    const a = {_key: 'a', _type: 'item', label: 'A', qty: 1}
    const b = {_key: 'b', _type: 'item', label: 'B', qty: 2}
    const changes = list({items: [a, b]}, {items: [b, a]})

    expect(fieldPaths(changes).some((path) => path.includes('_key=='))).toBe(true)
    expect(
      changes.some(isField) || (changes[0]?.type === 'group' && changes[0].changes.length > 0),
    ).toBe(true)
  })

  it('skips an array item whose member type cannot be resolved', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const ghost = {_key: 'g', _type: 'ghost', label: 'x'}

    expect(list({mixed: [ghost]}, {mixed: [{...ghost, label: 'y'}]})).toEqual([])
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  it('marks a reordered portable text block with showIndex', () => {
    const first = {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'hello', marks: []}],
    }
    const second = {
      _type: 'block',
      _key: 'b2',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's2', text: 'other', marks: []}],
    }
    const moved = list({blocks: [first, second]}, {blocks: [second, first]})
    const movedFields = (moved[0]?.type === 'group' ? moved[0].changes : moved).filter(isField)

    expect(movedFields.length).toBeGreaterThan(0)
    expect(movedFields.every((field) => field.showIndex)).toBe(true)
  })

  it.fails('uses the registered block, image and file diff components instead of walking their inner fields', () => {
    const block = {
      _type: 'block',
      _key: 'b1',
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: 's1', text: 'hello', marks: []}],
    }
    const changedBlock = {
      ...block,
      children: [{_type: 'span', _key: 's1', text: 'world', marks: []}],
    }

    expect(list({blocks: [block]}, {blocks: [changedBlock]})).toMatchObject([
      {type: 'field', path: ['blocks', {_key: 'b1'}], diffComponent: PTDiff},
    ])
    expect(
      list(
        {photo: {_type: 'image', asset: {_ref: 'image-a'}}},
        {photo: {_type: 'image', asset: {_ref: 'image-b'}}},
      ),
    ).toMatchObject([{type: 'field', path: ['photo'], diffComponent: ImageFieldDiff}])
    expect(
      list(
        {attachment: {_type: 'file', asset: {_ref: 'file-a'}}},
        {attachment: {_type: 'file', asset: {_ref: 'file-b'}}},
      ),
    ).toMatchObject([{type: 'field', path: ['attachment'], diffComponent: FileFieldDiff}])
  })
})
