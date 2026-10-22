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
import {warnFormNodeSuspended} from './FormNodeSuspense'

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

// Warnings are once per message, so each case uses its own component or path
describe('warnFormNodeSuspended', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warn.mockClear()
  })

  it('names the custom input, its path and document type, the remedy and the skill, and attaches it', () => {
    function CheckModelHasSize(props: StringInputProps) {
      return props.renderDefault(props)
    }

    warnFormNodeSuspended({
      schemaType: compileProduct({input: CheckModelHasSize}).models,
      path: ['models'],
      components: ['field', 'input'],
      documentType: 'product',
    })

    expect(warn).toHaveBeenCalledTimes(1)
    const [message, component] = warn.mock.calls[0]
    expect(message).toMatch(
      /^The custom input component <CheckModelHasSize> at "models" of a "product" document \(schema type "string"\) suspended without a <Suspense> boundary of its own/,
    )
    expect(message).toMatch(/fallback that reserves the space the loaded UI needs/)
    expect(message).toMatch(/skip that part until the document exists/)
    expect(message).toMatch(
      /npx skills add sanity-io\/sanity --skill sanity-form-component-suspense/,
    )
    expect(message).toMatch(/The component:$/)
    expect(component).toBe(CheckModelHasSize)
  })

  it('names every custom component that renders under the boundary', () => {
    function ModelField(props: StringFieldProps) {
      return props.renderDefault(props)
    }
    function ModelInput(props: StringInputProps) {
      return props.renderDefault(props)
    }

    warnFormNodeSuspended({
      schemaType: compileProduct({field: ModelField, input: ModelInput}).models,
      path: ['models'],
      components: ['field', 'input'],
    })

    const [message, ...attached] = warn.mock.calls[0]
    expect(message).toMatch(
      /^The custom field component <ModelField> or custom input component <ModelInput> at "models" \(schema type "string"\)/,
    )
    expect(message).toMatch(/The components:$/)
    expect(attached).toEqual([ModelField, ModelInput])
  })

  it('names a custom item component and the item path', () => {
    function ReviewItem(props: ObjectItemProps) {
      return props.renderDefault(props)
    }

    warnFormNodeSuspended({
      schemaType: compileProduct({item: ReviewItem}).review,
      path: ['reviews', {_key: 'first'}],
      components: ['item'],
      documentType: 'product',
    })

    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom item component <ReviewItem> at "reviews\[_key=="first"\]" of a "product" document \(schema type "review"\)/,
    )
  })

  it("points at plugins' form.components when the schema type declares no custom component", () => {
    warnFormNodeSuspended({
      schemaType: compileProduct({}).models,
      path: ['models', 'plugin'],
      components: ['field', 'input'],
    })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]).toHaveLength(1)
    expect(warn.mock.calls[0][0]).toMatch(
      /^A form component at "models\.plugin" \(schema type "string"\) suspended without a <Suspense> boundary of its own.*declares no custom field or input component, so it likely comes from a plugin's form\.components/,
    )
  })

  it('logs each message once', () => {
    function SharedItem(props: ObjectItemProps) {
      return props.renderDefault(props)
    }
    const {review} = compileProduct({item: SharedItem})
    const warnAt = (_key: string) =>
      warnFormNodeSuspended({schemaType: review, path: ['reviews', {_key}], components: ['item']})

    warnAt('a')
    warnAt('a')
    warnAt('b')

    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('describes a React.lazy component', () => {
    const LazyInput = lazy(() =>
      Promise.resolve({default: (props: StringInputProps) => props.renderDefault(props)}),
    )

    warnFormNodeSuspended({
      schemaType: compileProduct({input: LazyInput}).models,
      path: ['models'],
      components: ['field', 'input'],
    })

    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom input component \(a React\.lazy component\) at "models" \(schema type /,
    )
  })
})
