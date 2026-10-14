import userEvent from '@testing-library/user-event'
import {act, type ReactNode} from 'react'
import {PatchEvent, set, useFormValue} from 'sanity'
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

  it('renders number leaf inputs with step="any" and commits decimal entries', async () => {
    function DefaultForwarder(props: Record<string, unknown>) {
      const renderDefault = props.renderDefault as (p: Record<string, unknown>) => ReactNode
      return <>{renderDefault(props)}</>
    }
    const onChange = vi.fn()

    act(() => {
      handle = mountIsland(container, DefaultForwarder, {
        inputProps: {
          onChange,
          schemaType: {jsonType: 'number', name: 'number'},
          value: 1,
        },
        islandRenderDefault: true,
      })
    })

    const input = container.querySelector('input')
    expect(input).not.toBeNull()
    // Without step="any" the browser's default step of 1 marks decimals as
    // stepMismatch and the stepper arrows skip them.
    expect(input!.getAttribute('step')).toBe('any')

    await userEvent.type(input!, '.5')
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({type: 'set', value: 1.5}))
  })

  it('flattens PatchEvents from custom inputs into plain patches, keeping onChange identity stable', async () => {
    const hostOnChange = vi.fn()
    const seenOnChange: unknown[] = []
    function CustomInput(props: Record<string, unknown>) {
      seenOnChange.push(props.onChange)
      const emit = props.onChange as (event: unknown) => void
      return (
        <button type="button" onClick={() => emit(PatchEvent.from(set('from-custom')))}>
          emit
        </button>
      )
    }

    act(() => {
      handle = mountIsland(container, CustomInput, {
        inputProps: {onChange: hostOnChange},
      })
    })

    await userEvent.click(container.querySelector('button')!)
    expect(hostOnChange).toHaveBeenCalledTimes(1)
    const received = hostOnChange.mock.calls[0][0]
    // The host must get a plain patch object — its own PatchEvent.from uses
    // instanceof, which is always false for the island bundle's class.
    expect(received).not.toBeInstanceOf(PatchEvent)
    expect(received).toMatchObject({type: 'set', value: 'from-custom'})

    // Same host callback on the next push: the input must see the same
    // normalized wrapper identity, not a fresh closure per render.
    act(() => handle?.update({inputProps: {onChange: hostOnChange, value: 'changed'}}))
    expect(seenOnChange.length).toBeGreaterThan(1)
    expect(new Set(seenOnChange).size).toBe(1)
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
