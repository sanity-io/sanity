import Schema from '@sanity/schema'
import {ObjectSchemaType, Path} from '@sanity/types'
import {prepareFormState} from '../formState'
import {FieldMember, ObjectFormNode} from '../types'
import {pathToString} from '../../../field/paths'
import {isObjectFormNode} from '../types/asserters'
import {DEFAULT_PROPS} from './shared'

type CollapsibleOptions = {
  collapsible?: boolean
  collapsed?: boolean
}

type FieldDef =
  | {name: string; type: 'string'}
  | {name: string; type: 'object'; options?: CollapsibleOptions; fields: FieldDef[]}

function nestFields(
  levels: number,
  fieldName: string,
  collapsibleOptions?: CollapsibleOptions
): FieldDef {
  if (levels === 0) {
    return {name: fieldName, type: 'string'}
  }
  return {
    name: fieldName,
    type: 'object',
    options: collapsibleOptions,
    fields: [
      {name: 'stringField', type: 'string'},
      nestFields(levels - 1, fieldName, collapsibleOptions),
    ],
  }
}

function getBookType(fieldOptions: {
  stringField?: CollapsibleOptions // to assert that primitive fields are *not* collapsible
  booleanField?: CollapsibleOptions
  numberField?: CollapsibleOptions
  objectField?: CollapsibleOptions
  deep?: CollapsibleOptions
}) {
  return Schema.compile({
    name: 'test',
    types: [
      {
        name: 'book',
        type: 'document',
        fields: [
          {name: 'stringField', type: 'string', options: fieldOptions.stringField},
          {name: 'booleanField', type: 'boolean', options: fieldOptions.booleanField},
          {name: 'numberField', type: 'number', options: fieldOptions.numberField},
          {
            name: 'objectField',
            type: 'object',
            options: fieldOptions.objectField,
            fields: [
              {
                name: 'firstName',
                title: 'First name',
                type: 'string',
              },
              {
                name: 'lastName',
                title: 'Last name',
                type: 'string',
              },
            ],
          },
          {
            name: 'deep',
            type: 'object',
            fields: [nestFields(20, 'deep', fieldOptions.deep)],
          },
        ],
      },
    ],
  }).get('book')
}

test("doesn't make primitive fields collapsed even if they are configured to be", () => {
  // Note: the schema validation should possibly enforce this
  // Note2: We might want to support making all kinds of fields collapsible, even primitive fields
  //  e.g it makes sense for multiline strings, but this test is here to assert the current behavior of not allowing it.
  const bookType: ObjectSchemaType = getBookType({
    stringField: {collapsed: true},
    numberField: {collapsed: true},
    booleanField: {collapsed: true},
  })
  const result = prepareFormState({
    ...DEFAULT_PROPS,
    schemaType: bookType,
    document: {_id: 'foo', _type: 'book'},
  })

  expect(result).not.toBe(null)
  if (result === null) {
    throw new Error('should not be hidden')
  }
  const primitiveFields = result.members.filter(
    (member): member is FieldMember =>
      member.kind === 'field' &&
      (member.name === 'stringField' ||
        member.name === 'booleanField' ||
        member.name === 'numberField')
  )
  primitiveFields.forEach((field) => {
    expect(field.collapsible).toBe(false)
    expect(field.collapsed).toBe(false)
  })
})

describe('collapsible object fields', () => {
  it('makes object fields collapsible if `collapsed: true` is set on object field', () => {
    const bookType = getBookType({
      objectField: {collapsed: true},
    })
    const result = prepareFormState({
      ...DEFAULT_PROPS,
      schemaType: bookType,
      document: {_id: 'foo', _type: 'book'},
    })

    expect(result).not.toBe(null)
    if (result === null) {
      throw new Error('should not be hidden')
    }
    const objectField = result.members.find(
      (member): member is FieldMember => member.kind === 'field' && member.name === 'objectField'
    )
    expect(objectField?.collapsible).toBe(true)
    expect(objectField?.collapsed).toBe(true)
  })
  it('makes object fields collapsible if `collapsible: true` is set on object field', () => {
    const bookType = getBookType({
      objectField: {collapsible: true, collapsed: false},
    })
    const result = prepareFormState({
      ...DEFAULT_PROPS,
      schemaType: bookType,
      document: {_id: 'foo', _type: 'book'},
    })

    expect(result).not.toBe(null)
    if (result === null) {
      throw new Error('should not be hidden')
    }
    const objectField = result.members.find(
      (member): member is FieldMember => member.kind === 'field' && member.name === 'objectField'
    )
    expect(objectField?.collapsible).toBe(true)
    expect(objectField?.collapsed).toBe(false)
  })

  it('collapses object fields by default at nesting level 3 or deeper', () => {
    const bookType = getBookType({})
    const result = prepareFormState({
      ...DEFAULT_PROPS,
      schemaType: bookType,
      document: {_id: 'foo', _type: 'book'},
    })

    expect(result).not.toBe(null)
    if (result === null) {
      throw new Error('should not be hidden')
    }
    const aboveMember = getDeepFieldMember(result, new Array(2).fill('deep'))
    expect(aboveMember.collapsible).toBe(false)
    expect(aboveMember.collapsed).toBe(false)

    const atMember = getDeepFieldMember(result, new Array(3).fill('deep'))
    expect(atMember.collapsible).toBe(true)
    expect(atMember.collapsed).toBe(true)

    const belowMember = getDeepFieldMember(result, new Array(4).fill('deep'))
    expect(belowMember.collapsible).toBe(true)
    expect(belowMember.collapsed).toBe(true)
  })
  it('supports overriding collapsible behavior at nesting level 3 or deeper', () => {
    const bookType = getBookType({deep: {collapsible: false}})
    const result = prepareFormState({
      ...DEFAULT_PROPS,
      schemaType: bookType,
      document: {_id: 'foo', _type: 'book'},
    })

    expect(result).not.toBe(null)
    if (result === null) {
      throw new Error('should not be hidden')
    }
    const aboveMember = getDeepFieldMember(result, new Array(2).fill('deep'))
    expect(aboveMember.collapsible).toBe(false)
    expect(aboveMember.collapsed).toBe(false)

    const atMember = getDeepFieldMember(result, new Array(3).fill('deep'))
    expect(atMember.collapsible).toBe(false)
    expect(atMember.collapsed).toBe(false)

    const belowMember = getDeepFieldMember(result, new Array(4).fill('deep'))
    expect(belowMember.collapsible).toBe(false)
    expect(belowMember.collapsed).toBe(false)
  })
})

function getDeepFieldMember(objectFormNode: ObjectFormNode, path: Path): FieldMember {
  if (path.length === 0) {
    throw new Error('Empty path')
  }
  const [head, ...tail] = path

  const nextField = objectFormNode.members.find(
    (member): member is FieldMember => member.kind === 'field' && member.name === head
  )
  if (!nextField) {
    throw new Error(
      `Field with name "${head}" not found for object node at path "${pathToString(
        objectFormNode.path
      )}"`
    )
  }
  if (tail.length === 0) {
    return nextField
  }
  if (!isObjectFormNode(nextField.field)) {
    throw new Error('Cannot recurse into non-object nodes')
  }
  return getDeepFieldMember(nextField.field, tail)
}
