import userEvent from '@testing-library/user-event'
import React from 'react'
import {renderStringInput} from '../../../../test/form/renderStringInput'
import {StringInput} from './StringInput'

describe('StringInput', () => {
  it('renders input value', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => (
        <StringInput
          {...inputProps}
          elementProps={{...inputProps.elementProps, value: 'test'}}
          value="test"
        />
      ),
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
      render: (inputProps) => (
        <StringInput
          {...inputProps}
          value="test"
          elementProps={{...inputProps.elementProps, value: 'test'}}
        />
      ),
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
    const {onNativeChange, result} = await renderStringInput({
      render: (inputProps) => (
        <StringInput
          {...inputProps}
          value="tes"
          elementProps={{...inputProps.elementProps, value: 'tes'}}
        />
      ),
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')

    userEvent.type(input!, 't')

    expect(onNativeChange).toHaveBeenCalledTimes(1)
  })

  it('emits `unset` patch', async () => {
    const {onNativeChange, result} = await renderStringInput({
      render: (inputProps) => (
        <StringInput
          {...inputProps}
          value="t"
          elementProps={{...inputProps.elementProps, value: 't'}}
        />
      ),
      fieldDefinition: {
        type: 'string',
        name: 'string',
        title: 'String',
      },
    })

    const input = result.container.querySelector('input')
    expect(input!.value).toBe('t')

    userEvent.click(input!)
    userEvent.keyboard('[Backspace]')

    expect(onNativeChange).toHaveBeenCalledTimes(1)
  })
})
