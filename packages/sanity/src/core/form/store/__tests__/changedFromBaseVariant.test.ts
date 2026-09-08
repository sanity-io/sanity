import {type CurrentUser, defineField, defineType, type ObjectSchemaType} from '@sanity/types'
import {beforeEach, describe, expect, test} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {
  createPrepareFormState,
  type PrepareFormState,
  type RootFormStateOptions,
} from '../formState'
import {type FieldMember} from '../types/members'
import {
  type ArrayOfObjectsFormNode,
  type ArrayOfPrimitivesFormNode,
  type ObjectFormNode,
} from '../types/nodes'

let prepareFormState!: PrepareFormState

beforeEach(() => {
  prepareFormState = createPrepareFormState()
})

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'testDocument',
      type: 'document',
      fields: [
        defineField({name: 'title', type: 'string'}),
        defineField({
          name: 'body',
          type: 'object',
          fields: [defineField({name: 'intro', type: 'string'})],
        }),
        defineField({name: 'tags', type: 'array', of: [{type: 'string'}]}),
        defineField({
          name: 'items',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'item',
              fields: [defineField({name: 'label', type: 'string'})],
            },
          ],
        }),
        defineField({name: 'inFieldset', type: 'string', fieldset: 'meta'}),
      ],
      fieldsets: [{name: 'meta', options: {collapsible: true, collapsed: false}}],
    }),
  ],
})

const schemaType = schema.get('testDocument') as ObjectSchemaType

const currentUser: Omit<CurrentUser, 'role'> = {
  email: 'ada@sanity.io',
  id: 'x',
  name: 'Ada',
  roles: [],
}

const baseDocument = {
  _id: 'drafts.article',
  _type: 'testDocument',
  _rev: 'base-rev',
  title: 'Title',
  body: {intro: 'Intro'},
  tags: ['a', 'b'],
  items: [{_type: 'item', _key: 'k0', label: 'First'}],
  inFieldset: 'Fieldset value',
}

function prepare(
  documentValue: Record<string, unknown>,
  baseVariantValue: unknown,
  hasBaseVariant = true,
): ObjectFormNode {
  const options: RootFormStateOptions = {
    schemaType,
    documentValue,
    comparisonValue: documentValue,
    baseVariantValue,
    hasBaseVariant,
    currentUser,
    focusPath: [],
    openPath: [],
    presence: [],
    validation: [],
    changesOpen: false,
    collapsedFieldSets: undefined,
    collapsedPaths: undefined,
    fieldGroupState: undefined,
    hidden: undefined,
    readOnly: undefined,
    perspective: 'drafts',
    hasUpstreamVersion: false,
  }

  const state = prepareFormState(options)
  if (state === null) throw new Error('Expected form state')
  return state
}

function field(node: ObjectFormNode, name: string): FieldMember {
  const member = node._allMembers?.find(
    (candidate): candidate is FieldMember => candidate.kind === 'field' && candidate.name === name,
  )
  if (!member) throw new Error(`Expected a field member named "${name}"`)
  return member
}

function fieldsetField(node: ObjectFormNode, name: string): FieldMember {
  const fieldset = node._allMembers?.find((candidate) => candidate.kind === 'fieldSet')
  if (!fieldset || fieldset.kind !== 'fieldSet') throw new Error('Expected a fieldset member')
  const member = fieldset.fieldSet.members.find(
    (candidate): candidate is FieldMember => candidate.kind === 'field' && candidate.name === name,
  )
  if (!member) throw new Error(`Expected a fieldset field named "${name}"`)
  return member
}

describe('changedFromBaseVariant', () => {
  test('is false throughout when the document has no base variant', () => {
    // The gate is `hasBaseVariant`, not a comparison of the value with itself: without it, every
    // populated field would compare against `undefined` and report a change.
    const state = prepare(baseDocument, undefined, false)

    expect(state.changedFromBaseVariant).toBe(false)
    expect(field(state, 'title').field.changedFromBaseVariant).toBe(false)
    expect(field(state, 'tags').field.changedFromBaseVariant).toBe(false)
    expect(field(state, 'items').field.changedFromBaseVariant).toBe(false)
  })

  test('is false throughout when the value matches the base variant', () => {
    const state = prepare(baseDocument, {...baseDocument})

    expect(state.changedFromBaseVariant).toBe(false)
    expect(field(state, 'title').field.changedFromBaseVariant).toBe(false)
    expect(field(state, 'body').field.changedFromBaseVariant).toBe(false)
  })

  test('ignores differing document metadata at the root', () => {
    // A variant and its base variant always differ in `_id`, `_rev` and `_system`. Comparing whole
    // values would make every object node report a change, which is why object nodes aggregate.
    const state = prepare(baseDocument, {
      ...baseDocument,
      _id: 'versions.opaquescope.article',
      _rev: 'variant-rev',
      _system: {variant: {_ref: 'system.variant.nynorsk', _weak: true}},
    })

    expect(state.changedFromBaseVariant).toBe(false)
  })

  test('reports a changed primitive field, and rolls it up to the root', () => {
    const state = prepare(baseDocument, {...baseDocument, title: 'Different title'})

    expect(field(state, 'title').field.changedFromBaseVariant).toBe(true)
    expect(field(state, 'body').field.changedFromBaseVariant).toBe(false)
    expect(state.changedFromBaseVariant).toBe(true)
  })

  test('rolls a nested object field up through its parent object', () => {
    const state = prepare(baseDocument, {...baseDocument, body: {intro: 'Different intro'}})

    const body = field(state, 'body').field as ObjectFormNode
    expect(field(body, 'intro').field.changedFromBaseVariant).toBe(true)
    expect(body.changedFromBaseVariant).toBe(true)
    expect(state.changedFromBaseVariant).toBe(true)
  })

  test('rolls fieldset members up to the root', () => {
    // Fieldsets are a separate member kind; a rollup that only looked at `kind === 'field'` would
    // silently skip every field inside one.
    const state = prepare(baseDocument, {...baseDocument, inFieldset: 'Different'})

    expect(fieldsetField(state, 'inFieldset').field.changedFromBaseVariant).toBe(true)
    expect(state.changedFromBaseVariant).toBe(true)
  })

  test('detects a reordered array of primitives, which item aggregation alone cannot see', () => {
    const state = prepare(baseDocument, {...baseDocument, tags: ['b', 'a']})

    const tags = field(state, 'tags').field as ArrayOfPrimitivesFormNode
    expect(tags.changedFromBaseVariant).toBe(true)
    expect(state.changedFromBaseVariant).toBe(true)
  })

  test('compares array of primitives items against their own index, not the parent array', () => {
    // `prepareArrayOfPrimitivesMember` spreads the parent options into each item, so the item's
    // base variant value has to be narrowed explicitly alongside `value`.
    const state = prepare(baseDocument, {...baseDocument, tags: ['a', 'changed']})

    const tags = field(state, 'tags').field as ArrayOfPrimitivesFormNode
    const [first, second] = tags.members

    expect(first.kind === 'item' && first.item.changedFromBaseVariant).toBe(false)
    expect(second.kind === 'item' && second.item.changedFromBaseVariant).toBe(true)
  })

  test('matches array of objects items by _key', () => {
    const state = prepare(baseDocument, {
      ...baseDocument,
      items: [{_type: 'item', _key: 'k0', label: 'Different'}],
    })

    const items = field(state, 'items').field as ArrayOfObjectsFormNode
    const [item] = items.members

    expect(item.kind === 'item' && item.item.changedFromBaseVariant).toBe(true)
    expect(items.changedFromBaseVariant).toBe(true)
  })

  test('treats an array of objects item absent from the base variant as changed', () => {
    const state = prepare(baseDocument, {...baseDocument, items: []})

    const items = field(state, 'items').field as ArrayOfObjectsFormNode
    const [item] = items.members

    expect(item.kind === 'item' && item.item.changedFromBaseVariant).toBe(true)
    expect(items.changedFromBaseVariant).toBe(true)
  })
})
