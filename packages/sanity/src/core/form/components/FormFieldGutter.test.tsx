import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {createTestProvider} from '../../../../test/testUtils/TestProvider'
import {WithEnabledDivergences} from './__tests__/enabledDivergences'
import {FormFieldGutter} from './FormFieldGutter'

describe('FormFieldGutter', () => {
  it('anchors the gutter to the field path', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <FormFieldGutter path={['author', 'name']} changedFromBaseVariant={false} />
      </TestProvider>,
    )

    expect(screen.getByTestId('form-field-gutter')).toHaveAttribute(
      'style',
      expect.stringContaining('--input_author_name'),
    )
  })

  it('renders without an anchor when the path is missing', async () => {
    const TestProvider = await createTestProvider()

    expect(() =>
      render(
        <TestProvider>
          {/* @ts-expect-error -- `FormField` and `FormFieldSet` are public, and `path` only became required in v5.17, so older custom inputs still render them without one */}
          <FormFieldGutter changedFromBaseVariant={false} />
        </TestProvider>,
      ),
    ).not.toThrow()

    expect(screen.getByTestId('form-field-gutter')).not.toHaveAttribute('style')
  })

  it('renders without an anchor when the path is missing and divergence is enabled', async () => {
    const TestProvider = await createTestProvider()

    render(
      <TestProvider>
        <WithEnabledDivergences>
          {/* @ts-expect-error -- see above: older custom inputs render form fields without a `path` */}
          <FormFieldGutter changedFromBaseVariant={false} />
        </WithEnabledDivergences>
      </TestProvider>,
    )

    expect(screen.getByTestId('form-field-gutter')).not.toHaveAttribute('style')
  })
})
