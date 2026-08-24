import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {InvalidValueInput} from '../InvalidValueInput'

const baseProps = {
  actualType: 'string',
  validTypes: ['number'],
  value: 'not a number',
  onChange: vi.fn(),
}

describe('InvalidValueInput', () => {
  it('names the affected field in the title when a field title is given', async () => {
    const TestProvider = await createTestProvider({})

    render(
      <TestProvider>
        <InvalidValueInput {...baseProps} fieldName="rating" fieldTitle="Rating" />
      </TestProvider>,
    )

    expect(screen.getByText('Invalid data for Rating')).toBeInTheDocument()
  })

  it('falls back to the generic title when no field title is given', async () => {
    // Not every caller knows a title — an untitled schema type has none.
    const TestProvider = await createTestProvider({})

    render(
      <TestProvider>
        <InvalidValueInput {...baseProps} fieldName="rating" />
      </TestProvider>,
    )

    expect(screen.getByText('Invalid property value')).toBeInTheDocument()
  })

  it('shows the schema field name under developer info', async () => {
    const TestProvider = await createTestProvider({})

    render(
      <TestProvider>
        <InvalidValueInput {...baseProps} fieldName="rating" fieldTitle="Rating" />
      </TestProvider>,
    )

    expect(screen.getByText(/Field name:/)).toBeInTheDocument()
    expect(screen.getByText('rating')).toBeInTheDocument()
  })

  it('labels the destructive action as unsetting rather than resetting', async () => {
    // The button dispatches `unset()`, so "Reset value" described the wrong operation.
    const TestProvider = await createTestProvider({})

    render(
      <TestProvider>
        <InvalidValueInput {...baseProps} fieldName="rating" fieldTitle="Rating" />
      </TestProvider>,
    )

    expect(screen.getByRole('button', {name: 'Unset value'})).toBeInTheDocument()
  })
})
