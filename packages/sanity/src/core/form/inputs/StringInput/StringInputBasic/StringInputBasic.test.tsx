import userEvent from '@testing-library/user-event'
import {describe, expect, it} from 'vitest'

import {renderStringInput} from '../../../../../../test/form/renderStringInput'
import {StringInputBasic} from './StringInputBasic'

describe('StringInputBasic', () => {
  it('renders input value', async () => {
    const {result} = await renderStringInput({
      render: (inputProps) => (
        <StringInputBasic
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
        <StringInputBasic
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
        <StringInputBasic
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

    await userEvent.type(input!, 't')

    expect(onNativeChange).toHaveBeenCalledTimes(1)
  })

  it('emits `unset` patch', async () => {
    const {onNativeChange, result} = await renderStringInput({
      render: (inputProps) => (
        <StringInputBasic
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

    await userEvent.click(input!)
    await userEvent.keyboard('[Backspace]')

    expect(onNativeChange).toHaveBeenCalledTimes(1)
  })
})
