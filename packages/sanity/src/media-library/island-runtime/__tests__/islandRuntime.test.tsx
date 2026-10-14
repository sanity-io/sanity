import userEvent from '@testing-library/user-event'
import {act, type ReactNode} from 'react'
import {useFormValue} from 'sanity'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {type IslandHandle, mountIsland} from '../islandRuntime'

describe('mountIsland', () => {
  let container: HTMLDivElement
  let handle: IslandHandle | null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    handle = null
  })

  afterEach(() => {
    act(() => handle?.unmount())
    container.remove()
  })

  it('renders the input with pushed props, re-renders on update(), and unmounts', () => {
    function Probe(props: Record<string, unknown>) {
      return <div data-testid="probe">{String(props.value ?? '')}</div>
    }

    act(() => {
      handle = mountIsland(container, Probe, {inputProps: {value: 'first'}})
    })
    expect(container.textContent).toContain('first')

    act(() => handle?.update({inputProps: {value: 'second'}}))
    expect(container.textContent).toContain('second')

    act(() => handle?.unmount())
    handle = null
    expect(container.innerHTML).toBe('')
  })

  it('feeds the pushed document snapshot to useFormValue', () => {
    function TitleProbe() {
      const title = useFormValue(['title'])
      return <div>{String(title)}</div>
    }

    act(() => {
      handle = mountIsland(container, TitleProbe, {
        documentValue: {_id: 'drafts.doc-1', title: 'Hello island'},
        inputProps: {},
      })
    })
    expect(container.textContent).toContain('Hello island')
  })

  it('synthesizes renderDefault leaf inputs that emit plain set patches', async () => {
    function DefaultForwarder(props: Record<string, unknown>) {
      const renderDefault = props.renderDefault as (p: Record<string, unknown>) => ReactNode
      return <>{renderDefault(props)}</>
    }
    const onChange = vi.fn()

    act(() => {
      handle = mountIsland(container, DefaultForwarder, {
        inputProps: {
          onChange,
          schemaType: {jsonType: 'string', name: 'string'},
          value: 'abc',
        },
        islandRenderDefault: true,
      })
    })

    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    expect(input!.value).toBe('abc')

    await userEvent.type(input!, 'd')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({type: 'set', value: 'abcd'}))
  })

  it('shows the failure card instead of a blank field when the input crashes', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    function Boom(): never {
      throw new Error('boom')
    }

    act(() => {
      handle = mountIsland(container, Boom, {inputProps: {}})
    })

    expect(container.textContent).toContain("This field couldn't be loaded")
    expect(container.textContent).toContain('boom')
    consoleError.mockRestore()
  })
})
