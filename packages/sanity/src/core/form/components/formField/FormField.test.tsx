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

// The gutter carries both anchors, and CSS picks the label one while the child it shows is the
// base variant mark (`formFieldAnchor`). That is checked by its geometry in
// `FormFieldBaseVariantMark.browser.test.tsx`; jsdom has no anchor positioning, so these tests check
// the inputs to that rule.
describe('the base variant mark', () => {
  const anchorsOf = (gutter: HTMLElement) => ({
    input: gutter.style.getPropertyValue('--form-field-anchor-path'),
    label: gutter.style.getPropertyValue('--form-field-label-anchor-path'),
  })
  const shownChildIsLabelAnchored = (gutter: HTMLElement) =>
    gutter.firstElementChild?.hasAttribute('data-gutter-label-anchored') ?? false

  it('follows the title row of a field, not its input', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <FormField title="Body" inputId="body" path={['body']} changedFromBaseVariant>
          <input id="body" />
        </FormField>
      </TestProvider>,
    )

    const gutter = screen.getByTestId('form-field-gutter')
    expect(anchorsOf(gutter)).toEqual({input: '--input_body', label: '--label_body'})
    expect(shownChildIsLabelAnchored(gutter)).toBe(true)
  })

  it('follows the title row of a field set too', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <FormFieldSet
          title="Settings"
          inputId="settings"
          path={['settings']}
          changedFromBaseVariant
        >
          <input id="settings" />
        </FormFieldSet>
      </TestProvider>,
    )

    const gutter = screen.getByTestId('form-field-gutter')
    expect(anchorsOf(gutter)).toEqual({input: '--input_settings', label: '--label_settings'})
    expect(shownChildIsLabelAnchored(gutter)).toBe(true)
  })

  it('keeps following the input when the field does not differ from its base variant', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <FormField title="Body" inputId="body" path={['body']}>
          <input id="body" />
        </FormField>
      </TestProvider>,
    )

    const gutter = screen.getByTestId('form-field-gutter')
    expect(anchorsOf(gutter).input).toBe('--input_body')
    expect(shownChildIsLabelAnchored(gutter)).toBe(false)
  })

  it('keeps following the input when the field has no title row', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <FormField inputId="body" path={['body']} changedFromBaseVariant>
          <input id="body" />
        </FormField>
      </TestProvider>,
    )

    expect(anchorsOf(screen.getByTestId('form-field-gutter'))).toEqual({
      input: '--input_body',
      label: '--input_body',
    })
  })
})
