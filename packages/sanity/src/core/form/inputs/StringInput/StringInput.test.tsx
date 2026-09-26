import {act, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {renderStringInput} from '../../../../../test/form/renderStringInput'
import {type StringInputProps} from '../../types/inputProps'
import type * as StringInputModule from './StringInput'
import {StringInput} from './StringInput'

const doubles = vi.hoisted(() => {
  let arrive!: () => void
  const arrived = new Promise<void>((resolve) => {
    arrive = resolve
  })
  return {arrived, arrive, editorFocus: vi.fn(), basicMounts: 0}
})

vi.mock('./StringInputBasic/StringInputBasic', async () => {
  const {useEffect} = await import('react')
  function StringInputBasic(props: StringInputProps) {
    useEffect(() => {
      doubles.basicMounts += 1
    }, [])
    return <input data-testid="string-input-basic" value={props.value ?? ''} readOnly />
  }
  return {StringInputBasic}
})

// Stands in for the code-split editor chunk: the factory (and so the `import()` in
// `StringInput`) does not resolve until the test lets it.
vi.mock('./StringInputPortableText/StringInputPortableText', async () => {
  await doubles.arrived
  const {useEffect} = await import('react')
  function StringInputPortableText(props: StringInputProps) {
    const {ref} = props.elementProps
    useEffect(() => {
      ref.current = {focus: doubles.editorFocus}
      return () => {
        ref.current = undefined
      }
    }, [ref])
    return <div data-testid="string-input-pte" />
  }
  return {StringInputPortableText}
})

const fieldDefinition = {type: 'string', name: 'string', title: 'String'} as const

describe('StringInput', () => {
  it('renders the plain input when inline changes are off', async () => {
    await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} />,
      fieldDefinition,
    })

    expect(screen.getByTestId('string-input-basic')).toBeInTheDocument()
    expect(screen.queryByTestId('string-input-pte')).not.toBeInTheDocument()
  })

  it('stands in with the plain input until the editor chunk arrives, then hands it focus, and renders the editor directly once loaded', async () => {
    await renderStringInput({
      render: (inputProps) => <StringInput {...inputProps} displayInlineChanges focused />,
      fieldDefinition,
    })

    // Chunk pending: the plain input is the fallback, so the field is usable meanwhile.
    expect(screen.getByTestId('string-input-basic')).toBeInTheDocument()
    expect(screen.queryByTestId('string-input-pte')).not.toBeInTheDocument()
    expect(doubles.editorFocus).not.toHaveBeenCalled()

    await act(async () => {
      doubles.arrive()
    })
    expect(await screen.findByTestId('string-input-pte')).toBeInTheDocument()
    expect(screen.queryByTestId('string-input-basic')).not.toBeInTheDocument()
    // The field was focused while the plain input stood in, so the editor takes the focus over.
    expect(doubles.editorFocus).toHaveBeenCalledTimes(1)
  })

  it('renders the editor in the first pass when the chunk was preloaded', async () => {
    // A fresh module instance: nothing has rendered (and so nothing has let React track the
    // load) before the preload, which is the document pane's situation.
    vi.resetModules()
    const fresh: typeof StringInputModule = await import('./StringInput')
    doubles.arrive()
    await fresh.preloadStringInputPortableText()

    const basicMountsBefore = doubles.basicMounts
    await renderStringInput({
      render: (inputProps) => <fresh.StringInput {...inputProps} displayInlineChanges />,
      fieldDefinition,
    })

    expect(screen.getByTestId('string-input-pte')).toBeInTheDocument()
    expect(doubles.basicMounts).toBe(basicMountsBefore)
  })
})
