import {describe, expect, test} from 'vitest'

import {
  type ArrayOfObjectsItemMember,
  type ArrayOfObjectsMember,
  type FieldMember,
  type ObjectMember,
} from '../../../store'
import {resolveMemberAtPath} from './resolveMemberAtPath'

// Form-store member fixtures are intentionally narrow: only the fields
// the walker actually reads (`kind`, `key`, `name`, `members`, and the
// flag `field.schemaType.jsonType === 'array'` that
// `isArrayOfObjectsFieldMember` keys on) are populated. Everything else
// is cast through `unknown` to keep the fixtures legible.

function arrayItem(key: string, members: ObjectMember[] = []): ArrayOfObjectsItemMember {
  return {
    kind: 'item',
    key,
    index: 0,
    collapsed: undefined,
    collapsible: undefined,
    open: false,
    parentSchemaType: {} as never,
    item: {
      members,
    } as never,
  }
}

function arrayField(name: string, members: ArrayOfObjectsMember[]): FieldMember {
  return {
    kind: 'field',
    key: name,
    name,
    index: 0,
    collapsed: undefined,
    collapsible: undefined,
    open: false,
    inSelectedGroup: false,
    groups: [],
    field: {
      schemaType: {jsonType: 'array'},
      members,
    } as never,
  } as unknown as FieldMember
}

function objectField(name: string): FieldMember {
  return {
    kind: 'field',
    key: name,
    name,
    index: 0,
    collapsed: undefined,
    collapsible: undefined,
    open: false,
    inSelectedGroup: false,
    groups: [],
    field: {
      schemaType: {jsonType: 'object'},
    } as never,
  } as unknown as FieldMember
}

describe(resolveMemberAtPath.name, () => {
  test('resolves a top-level block by `_key`', () => {
    const block = arrayItem('b1')
    const resolved = resolveMemberAtPath([block], ['body'], ['body', {_key: 'b1'}])
    expect(resolved).toBe(block)
  })

  test('resolves a nested block inside a container, depth-agnostically', () => {
    // Tree: body[{_key:'callout'}].lines[{_key:'b1'}]
    const innerBlock = arrayItem('b1')
    const callout = arrayItem('callout', [arrayField('lines', [innerBlock])])
    const resolved = resolveMemberAtPath(
      [callout],
      ['body'],
      ['body', {_key: 'callout'}, 'lines', {_key: 'b1'}],
    )
    expect(resolved).toBe(innerBlock)
  })

  test('resolves an inline child inside a text block', () => {
    // Tree: body[{_key:'b1'}].children[{_key:'i1'}]
    const inlineChild = arrayItem('i1')
    const block = arrayItem('b1', [arrayField('children', [inlineChild])])
    const resolved = resolveMemberAtPath(
      [block],
      ['body'],
      ['body', {_key: 'b1'}, 'children', {_key: 'i1'}],
    )
    expect(resolved).toBe(inlineChild)
  })

  test('resolves a deeply-nested container block (depth ≥ 3)', () => {
    // Tree: body[{_key:'table'}].rows[{_key:'row1'}].cells[{_key:'cell1'}].lines[{_key:'b1'}]
    const innerBlock = arrayItem('b1')
    const cell = arrayItem('cell1', [arrayField('lines', [innerBlock])])
    const row = arrayItem('row1', [arrayField('cells', [cell])])
    const table = arrayItem('table', [arrayField('rows', [row])])
    const resolved = resolveMemberAtPath(
      [table],
      ['body'],
      [
        'body',
        {_key: 'table'},
        'rows',
        {_key: 'row1'},
        'cells',
        {_key: 'cell1'},
        'lines',
        {_key: 'b1'},
      ],
    )
    expect(resolved).toBe(innerBlock)
  })

  test('resolves an object-block field by name', () => {
    // Tree: body[{_key:'image'}].caption
    const caption = objectField('caption')
    const image = arrayItem('image', [caption])
    const resolved = resolveMemberAtPath([image], ['body'], ['body', {_key: 'image'}, 'caption'])
    expect(resolved).toBe(caption)
  })

  test('returns `undefined` when a keyed segment misses', () => {
    const block = arrayItem('b1')
    const resolved = resolveMemberAtPath([block], ['body'], ['body', {_key: 'missing'}])
    expect(resolved).toBeUndefined()
  })

  test('returns `undefined` when a field segment misses', () => {
    const block = arrayItem('b1', [objectField('title')])
    const resolved = resolveMemberAtPath([block], ['body'], ['body', {_key: 'b1'}, 'missing'])
    expect(resolved).toBeUndefined()
  })

  test('returns `undefined` when the target path is the input root', () => {
    const block = arrayItem('b1')
    const resolved = resolveMemberAtPath([block], ['body'], ['body'])
    expect(resolved).toBeUndefined()
  })

  test('returns `undefined` when the target path is shorter than the input path', () => {
    const block = arrayItem('b1')
    const resolved = resolveMemberAtPath([block], ['body'], [])
    expect(resolved).toBeUndefined()
  })

  test('returns `undefined` when a field is read off a non-object item', () => {
    // A keyed segment followed by another keyed segment without a field
    // name between is malformed.
    const block = arrayItem('b1')
    const resolved = resolveMemberAtPath(
      [block],
      ['body'],
      ['body', {_key: 'b1'}, {_key: 'unexpected'}],
    )
    expect(resolved).toBeUndefined()
  })
})
