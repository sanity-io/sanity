import {type ArraySchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {describe, expect, it} from 'vitest'

import {ArrayValidationProvider, useArrayValidation} from './ArrayValidationContext'

// Helper component to test the hook
function TestConsumer() {
  const validation = useArrayValidation()
  return <div data-testid="result">{validation?.maxReached ? 'max-reached' : 'not-reached'}</div>
}

describe('ArrayValidationContext', () => {
  const createMockSchemaType = (maxConstraint?: number): ArraySchemaType => {
    const validation =
      maxConstraint !== undefined
        ? [
            {
              _rules: [{flag: 'max' as const, constraint: maxConstraint}],
            },
          ]
        : undefined

    return {
      name: 'testArray',
      jsonType: 'array',
      of: [{name: 'testItem', jsonType: 'object', type: {name: 'testItem', jsonType: 'object'}}],
      validation,
    } as ArraySchemaType
  }

  it('should return maxReached=false when no max constraint', () => {
    const schemaType = createMockSchemaType()

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={5}>
        <TestConsumer />
      </ArrayValidationProvider>,
    )

    expect(screen.getByTestId('result')).toHaveTextContent('not-reached')
  })

  it('should return maxReached=false when item count is below max', () => {
    const schemaType = createMockSchemaType(5)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={3}>
        <TestConsumer />
      </ArrayValidationProvider>,
    )

    expect(screen.getByTestId('result')).toHaveTextContent('not-reached')
  })

  it('should return maxReached=true when item count equals max', () => {
    const schemaType = createMockSchemaType(5)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={5}>
        <TestConsumer />
      </ArrayValidationProvider>,
    )

    expect(screen.getByTestId('result')).toHaveTextContent('max-reached')
  })

  it('should return maxReached=true when item count exceeds max', () => {
    const schemaType = createMockSchemaType(5)

    render(
      <ArrayValidationProvider schemaType={schemaType} itemCount={10}>
        <TestConsumer />
      </ArrayValidationProvider>,
    )

    expect(screen.getByTestId('result')).toHaveTextContent('max-reached')
  })

  it('should return null when used outside of provider', () => {
    function TestOutsideProvider() {
      const validation = useArrayValidation()
      return <div data-testid="result">{validation === null ? 'null' : 'has-value'}</div>
    }

    render(<TestOutsideProvider />)

    expect(screen.getByTestId('result')).toHaveTextContent('null')
  })
})
