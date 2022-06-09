import {defineType} from '@sanity/types'
import React from 'react'
import {renderNumberInput} from '../../../test/form'
import {NumberInput} from './NumberInput'

const defs = {
  num: defineType({name: 'num', title: 'Number', type: 'number'}),
}

describe('NumberInput', () => {
  it('renders the number input field', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: defs.num,
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')
    expect(input).toBeDefined()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('accepts decimals by default', async () => {
    const {result} = await renderNumberInput({
      fieldDefinition: defs.num,
      render: (inputProps) => <NumberInput {...inputProps} />,
    })

    const input = result.container.querySelector('input')

    input!.value = '1.2'
    expect(input!.value).toBe('1.2')
    expect(input!.checkValidity()).toBe(true)
  })
})
