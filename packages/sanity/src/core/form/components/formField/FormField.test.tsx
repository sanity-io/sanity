import {defineType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {createSchema} from '../../../schema/createSchema'
import {WithEnabledDivergences} from '../__tests__/enabledDivergences'
import {FormField} from './FormField'
import {FormFieldSet} from './FormFieldSet'

// `FormField` and `FormFieldSet` are exported from `sanity`, and their `path` prop only became
// required in v5.17. Custom inputs written before that still render them without a path, which must
// not take down the document form.

const arrayType = createSchema({
  name: 'test',
  types: [defineType({name: 'tags', type: 'array', of: [{type: 'string'}]})],
}).get('tags')

describe('FormField', () => {
  it('renders when the path is missing', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        {/* @ts-expect-error -- pre-5.17 consumers render `FormField` without the required `path` prop */}
        <FormField title="Title" inputId="title">
          <input id="title" data-testid="title-input" />
        </FormField>
      </TestProvider>,
    )

    expect(screen.getByTestId('title-input')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('renders when the path is missing and divergence is enabled', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <WithEnabledDivergences>
          {/* @ts-expect-error -- pre-5.17 consumers render `FormField` without the required `path` prop */}
          <FormField title="Title" inputId="title">
            <input id="title" data-testid="title-input" />
          </FormField>
        </WithEnabledDivergences>
      </TestProvider>,
    )

    expect(screen.getByTestId('title-input')).toBeInTheDocument()
  })
})

describe('FormFieldSet', () => {
  it('renders when the path is missing', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        {/* @ts-expect-error -- pre-5.17 consumers render `FormFieldSet` without the required `path` prop */}
        <FormFieldSet title="Address" inputId="address">
          <input id="address" data-testid="address-input" />
        </FormFieldSet>
      </TestProvider>,
    )

    expect(screen.getByTestId('address-input')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
  })

  it('renders an array fieldset when the path is missing and divergence is enabled', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <WithEnabledDivergences>
          {/* @ts-expect-error -- pre-5.17 consumers render `FormFieldSet` without the required `path` prop */}
          <FormFieldSet title="Tags" inputId="tags" schemaType={arrayType}>
            <input id="tags" data-testid="tags-input" />
          </FormFieldSet>
        </WithEnabledDivergences>
      </TestProvider>,
    )

    expect(screen.getByTestId('tags-input')).toBeInTheDocument()
  })
})
