import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type SchemaType,
} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {type StringFieldProps} from '../../types/fieldProps'
import {type StringInputProps} from '../../types/inputProps'
import {type ObjectItemProps} from '../../types/itemProps'
import {defaultResolveFieldComponent} from './fieldResolver'
import {defaultResolveInputComponent} from './inputResolver'
import {defaultResolveItemComponent} from './itemResolver'
import {
  warnCustomComponentSuspended,
  withCustomComponentSuspense,
} from './withCustomComponentSuspense'

function compileProduct(options: {
  input?: ComponentType<StringInputProps>
  field?: ComponentType<StringFieldProps>
  item?: ComponentType<ObjectItemProps>
}): {models: SchemaType; review: SchemaType} {
  const schema = createSchema({
    name: 'test',
    types: [
      defineType({
        name: 'product',
        type: 'document',
        fields: [
          defineField({
            name: 'models',
            type: 'string',
            components: {input: options.input, field: options.field},
          }),
          defineField({
            name: 'reviews',
            type: 'array',
            of: [
              defineArrayMember({
                name: 'review',
                type: 'object',
                fields: [defineField({name: 'title', type: 'string'})],
                components: {item: options.item},
              }),
            ],
          }),
        ],
      }),
    ],
  })
  const product = schema.get('product') as ObjectSchemaType
  const reviews = product.fields[1].type as ArraySchemaType
  return {models: product.fields[0].type, review: reviews.of[0]}
}

function PassThroughInput(props: StringInputProps) {
  return props.renderDefault(props)
}
function PassThroughField(props: StringFieldProps) {
  return props.renderDefault(props)
}
function PassThroughItem(props: ObjectItemProps) {
  return props.renderDefault(props)
}

describe('withCustomComponentSuspense', () => {
  it('returns one wrapper per slot and component, so resolving again never remounts the node', () => {
    const first = withCustomComponentSuspense('input', PassThroughInput)

    expect(first).not.toBe(PassThroughInput)
    expect(withCustomComponentSuspense('input', PassThroughInput)).toBe(first)
    expect(withCustomComponentSuspense('field', PassThroughInput)).not.toBe(first)
  })

  it("wraps a schema type's custom input, field and item when the resolvers resolve them", () => {
    const {models, review} = compileProduct({
      input: PassThroughInput,
      field: PassThroughField,
      item: PassThroughItem,
    })

    expect(defaultResolveInputComponent(models)).toBe(
      withCustomComponentSuspense('input', PassThroughInput),
    )
    expect(defaultResolveFieldComponent(models)).toBe(
      withCustomComponentSuspense('field', PassThroughField),
    )
    expect(defaultResolveItemComponent(review)).toBe(
      withCustomComponentSuspense('item', PassThroughItem),
    )
  })

  it('leaves the built-in components unwrapped', () => {
    const {models, review} = compileProduct({})
    const builtIns = [
      defaultResolveInputComponent(models),
      defaultResolveFieldComponent(models),
      defaultResolveItemComponent(review),
    ]

    for (const builtIn of builtIns) {
      expect(builtIn.name).not.toBe('CustomComponentWithSuspense')
    }
  })
})

// Warnings are once per slot and component, so each case declares its own component
describe('warnCustomComponentSuspended', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warn.mockClear()
  })

  it('names the input, its path and document type, the remedy and the skill, and attaches it', () => {
    function CheckModelHasSize(props: StringInputProps) {
      return props.renderDefault(props)
    }

    warnCustomComponentSuspended({
      slot: 'input',
      component: CheckModelHasSize,
      schemaType: compileProduct({input: CheckModelHasSize}).models,
      path: ['models'],
      documentType: 'product',
    })

    expect(warn).toHaveBeenCalledTimes(1)
    const [message, component] = warn.mock.calls[0]
    expect(message).toMatch(
      /^The custom input component <CheckModelHasSize> at "models" of a "product" document \(schema type "string", components\.input\) suspended without a <Suspense> boundary of its own/,
    )
    expect(message).toMatch(/fallback that reserves the space the loaded UI needs/)
    expect(message).toMatch(/skip that part until the document exists/)
    expect(message).toMatch(
      /npx skills add sanity-io\/sanity --skill sanity-form-component-suspense/,
    )
    expect(component).toBe(CheckModelHasSize)
  })

  it('names a custom field component', () => {
    function ModelField(props: StringFieldProps) {
      return props.renderDefault(props)
    }

    warnCustomComponentSuspended({
      slot: 'field',
      component: ModelField,
      schemaType: compileProduct({field: ModelField}).models,
      path: ['models'],
    })

    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom field component <ModelField> at "models" \(schema type "string", components\.field\)/,
    )
    expect(warn.mock.calls[0][1]).toBe(ModelField)
  })

  it('names a custom item component and the item path', () => {
    function ReviewItem(props: ObjectItemProps) {
      return props.renderDefault(props)
    }

    warnCustomComponentSuspended({
      slot: 'item',
      component: ReviewItem,
      schemaType: compileProduct({item: ReviewItem}).review,
      path: ['reviews', {_key: 'first'}],
      documentType: 'product',
    })

    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom item component <ReviewItem> at "reviews\[_key=="first"\]" of a "product" document \(schema type "review", components\.item\)/,
    )
  })

  it('warns once per component in a slot, however many nodes use it', () => {
    function SharedItem(props: ObjectItemProps) {
      return props.renderDefault(props)
    }
    const {review} = compileProduct({item: SharedItem})

    for (const _key of ['a', 'b']) {
      warnCustomComponentSuspended({
        slot: 'item',
        component: SharedItem,
        schemaType: review,
        path: ['reviews', {_key}],
      })
    }

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('describes a React.lazy component, and leaves out the document type when there is none', () => {
    const LazyInput = lazy(() => Promise.resolve({default: PassThroughInput}))

    warnCustomComponentSuspended({
      slot: 'input',
      component: LazyInput,
      schemaType: compileProduct({input: LazyInput}).models,
      path: ['models'],
    })

    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom input component \(a React\.lazy component\) at "models" \(schema type /,
    )
  })
})
