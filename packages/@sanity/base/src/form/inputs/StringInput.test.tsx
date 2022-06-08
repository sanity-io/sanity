import userEvent from '@testing-library/user-event'
import React from 'react'
import {renderStringInput} from '../../../test/form/renderStringInput'
import {StringInput} from './StringInput'

describe('StringInput', () => {
  it('renders input value', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} value="test" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')

    expect(input?.value).toBe('test')
  })

  it('emits onFocus', async () => {
    const {onFocus, result} = await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} value="test" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')

    input?.focus()

    expect(onFocus.mock.calls).toHaveLength(1)
  })

  it('emits `set` patch', async () => {
    const {onChange, result} = await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} value="tes" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')

    userEvent.type(input!, 't')

    expect(onChange.mock.calls).toEqual([[{type: 'set', path: [], value: 'test'}]])
  })

  it('emits `unset` patch', async () => {
    const {onChange, result} = await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} value="t" />,
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')

    userEvent.click(input!)
    userEvent.keyboard('[Backspace]')

    expect(onChange.mock.calls).toEqual([[{type: 'unset', path: []}]])
  })
})
