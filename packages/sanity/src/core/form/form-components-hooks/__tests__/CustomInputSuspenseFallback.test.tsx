import {defineField, defineType, type ObjectSchemaType, type SchemaType} from '@sanity/types'
import {type ComponentType, lazy} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createSchema} from '../../../schema/createSchema'
import {type StringInputProps} from '../../types/inputProps'
import {warnCustomInputSuspended} from '../CustomInputSuspenseFallback'

function fieldType(input: ComponentType<StringInputProps> | undefined): SchemaType {
  const schema = createSchema({
    name: 'test',
    types: [
      defineType({
        name: 'product',
        type: 'document',
        fields: [defineField({name: 'models', type: 'string', components: {input}})],
      }),
    ],
  })
  const product = schema.get('product') as ObjectSchemaType
  return product.fields[0].type
}

// Warnings are once per component, so each case declares its own
describe('warnCustomInputSuspended', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  afterEach(() => {
    warn.mockClear()
  })

  it('names the component, the field and the remedy, and attaches the component', () => {
    function CheckModelHasSize(props: StringInputProps) {
      return props.renderDefault(props)
    }

    warnCustomInputSuspended({
      schemaType: fieldType(CheckModelHasSize),
      path: ['models'],
      documentType: 'product',
    })

    expect(warn).toHaveBeenCalledTimes(1)
    const [message, component] = warn.mock.calls[0]
    expect(message).toMatch(
      /^The custom input <CheckModelHasSize> for the field "models" of a "product" document \(schema type "string"\) suspended without a <Suspense> boundary of its own/,
    )
    expect(message).toMatch(/fallback that reserves the space the loaded input needs/)
    expect(message).toMatch(/skip that part until the document exists/)
    expect(message).toMatch(/npx skills add sanity-io\/sanity --skill sanity-custom-input-suspense/)
    expect(component).toBe(CheckModelHasSize)
  })

  it('warns once per component, however many fields use it', () => {
    function SharedInput(props: StringInputProps) {
      return props.renderDefault(props)
    }
    const schemaType = fieldType(SharedInput)

    warnCustomInputSuspended({schemaType, path: ['models']})
    warnCustomInputSuspended({schemaType, path: ['other', 'models']})

    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('describes a React.lazy input and the document root', () => {
    const LazyInput = lazy(() =>
      Promise.resolve({default: (props: StringInputProps) => props.renderDefault(props)}),
    )

    warnCustomInputSuspended({schemaType: fieldType(LazyInput), path: []})

    // Without a form value there is no document type to name
    expect(warn.mock.calls[0][0]).toMatch(
      /^The custom input \(a React\.lazy component\) for the document root \(schema type /,
    )
  })

  it('stays quiet for a schema type without a custom input', () => {
    warnCustomInputSuspended({schemaType: fieldType(undefined), path: ['models']})

    expect(warn).not.toHaveBeenCalled()
  })
})
