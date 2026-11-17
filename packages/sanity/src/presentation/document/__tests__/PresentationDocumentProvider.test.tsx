import {act, render} from '@testing-library/react'
import {Activity, useContext} from 'react'
import {PresentationDocumentContext} from 'sanity/_singletons'
import {describe, expect, it} from 'vitest'

import {type PresentationPluginOptions} from '../../types'
import {PresentationDocumentProvider} from '../PresentationDocumentProvider'

const rootOptions: PresentationPluginOptions = {name: 'root', previewUrl: '/'}
const nestedOptions: PresentationPluginOptions = {name: 'nested', previewUrl: '/nested'}

/** Records the option names the context exposes on every render. */
function Recorder({renders}: {renders: string[][]}) {
  const context = useContext(PresentationDocumentContext)
  renders.push((context?.options ?? []).map((o) => o.name ?? ''))
  return null
}

describe('PresentationDocumentProvider', () => {
  it('exposes its own options from the first render, without waiting for an effect', () => {
    const renders: string[][] = []
    render(
      <PresentationDocumentProvider options={rootOptions}>
        <Recorder renders={renders} />
      </PresentationDocumentProvider>,
    )

    expect(renders[0]).toEqual(['root'])
    expect(renders.at(-1)).toEqual(['root'])
  })

  it('lists nested providers after its own options, and drops them when they unmount', () => {
    const renders: string[][] = []
    const tree = (withNested: boolean) => (
      <PresentationDocumentProvider options={rootOptions}>
        {withNested ? (
          <PresentationDocumentProvider options={nestedOptions}>
            <Recorder renders={renders} />
          </PresentationDocumentProvider>
        ) : (
          <Recorder renders={renders} />
        )}
      </PresentationDocumentProvider>
    )
    const {rerender} = render(tree(true))
    expect(renders.at(-1)).toEqual(['root', 'nested'])

    rerender(tree(false))
    expect(renders.at(-1)).toEqual(['root'])
  })

  it('keeps its own options while hidden inside an Activity boundary', async () => {
    const renders: string[][] = []
    const tree = (mode: 'visible' | 'hidden') => (
      <Activity mode={mode}>
        <PresentationDocumentProvider options={rootOptions}>
          <Recorder renders={renders} />
        </PresentationDocumentProvider>
      </Activity>
    )
    const {rerender} = render(tree('visible'))
    expect(renders.at(-1)).toEqual(['root'])

    // Hiding tears the effects down and showing re-creates them; the options never disappear,
    // so a locations banner reading them is not unmounted and remounted along the way.
    rerender(tree('hidden'))
    // Let React process the hidden tree's deferred work before showing it again
    await act(async () => {
      await Promise.resolve()
    })
    rerender(tree('visible'))

    expect(renders.every((names) => names.includes('root'))).toBe(true)
    expect(renders.at(-1)).toEqual(['root'])
  })
})
