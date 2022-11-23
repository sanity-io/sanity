// eslint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/extend-expect'
import React from 'react'
import {renderNumberInput} from '../../../../test/form'
import {NumberInput} from './NumberInput'

describe('number-input', () => {
  it('renders the number input field', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: {
        name: 'defaultNumber',
        title: 'Integer',
        type: 'number',
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })
    const input = result.container.querySelector('input')
    expect(input).toBeDefined()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('accepts decimals by default', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: {
        name: 'defaultNumber',
        title: 'Integer',
        type: 'number',
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })
    const input = result.container.querySelector('input')
    input!.value = '1.2'
    expect(input!.valueAsNumber).toBe(1.2)
    expect(input!.checkValidity()).toBe(true)
  })

  it('renders inputMode equals text if there is no min rule', async () => {
    // Note: we want "text" because devices may or may not show a minus key.
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inputmode#values
    const {result} = await renderNumberInput({
      fieldDefinition: {
        name: 'defaultNumber',
        title: 'Integer',
        type: 'number',
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')!
    expect(input.inputMode).toBe('text')
  })

  it('renders inputMode equals "decimal" if there is a min rule', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: {
        name: 'positiveNumber',
        title: 'A positive number',
        type: 'number',
        validation: (Rule) => Rule.positive(),
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')!

    expect(input.inputMode).toBe('decimal')
  })

  it('renders inputMode equals "numeric" if there is a min rule and integer rule', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: {
        name: 'positiveInteger',
        title: 'Integer',
        type: 'number',
        validation: (Rule) => Rule.integer().positive(),
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')!
    expect(input.inputMode).toBe('numeric')
  })

  it('renders inputMode equals "numeric" if there is a min rule and zero precision rule', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: {
        // should be handled the same way as an integer
        name: 'positiveZeroPrecisionNumber',
        title: 'Integer',
        type: 'number',
        validation: (Rule) => Rule.precision(0).positive(),
      },
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')!
    expect(input.inputMode).toBe('numeric')
  })
})
