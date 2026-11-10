import {type ObjectSchemaType} from '@sanity/types'
import {act, render, screen} from '@testing-library/react'
import {Activity} from 'react'
import {Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type DocumentLocationsState} from '../types'
import {useDocumentLocations} from '../useDocumentLocations'

vi.mock('sanity', () => ({
  useDocumentStore: () => ({}),
  useDocumentPreviewStore: () => ({}),
}))

vi.mock('../usePresentationPerspectiveStack', () => ({
  usePresentationPerspectiveStack: () => ['drafts'],
}))

vi.mock('../usePresentationVariant', () => ({
  usePresentationVariant: () => undefined,
}))

const type = {name: 'author'} as unknown as ObjectSchemaType

function Locations({resolve}: {resolve: () => Subject<DocumentLocationsState>}) {
  const {state, status} = useDocumentLocations({
    id: 'doc',
    version: undefined,
    resolvers: resolve,
    type,
  })
  return (
    <output data-testid="locations">
      {status}:{state.locations?.length ?? 0}
    </output>
  )
}

function Harness({
  mode,
  resolve,
}: {
  mode: 'visible' | 'hidden'
  resolve: () => Subject<DocumentLocationsState>
}) {
  return (
    <Activity mode={mode}>
      <Locations resolve={resolve} />
    </Activity>
  )
}

describe('useDocumentLocations', () => {
  it('reports resolving until the resolver emits', () => {
    const locations$ = new Subject<DocumentLocationsState>()
    const resolve = () => locations$
    render(<Harness mode="visible" resolve={resolve} />)

    expect(screen.getByTestId('locations')).toHaveTextContent('resolving:0')

    act(() => locations$.next({locations: [{title: 'Home', href: '/'}]}))

    expect(screen.getByTestId('locations')).toHaveTextContent('resolved:1')
  })

  it('keeps the resolved locations when the subscription is re-created without a remount', async () => {
    const locations$ = new Subject<DocumentLocationsState>()
    const resolve = () => locations$
    const {rerender} = render(<Harness mode="visible" resolve={resolve} />)
    act(() => locations$.next({locations: [{title: 'Home', href: '/'}]}))
    expect(screen.getByTestId('locations')).toHaveTextContent('resolved:1')

    // Hiding the tool tears the subscription down. react-rx releases the shared source through
    // the asap scheduler (a microtask) once the last subscriber is gone, so awaiting one is the
    // point after which the next subscription starts the resolver observable over from scratch.
    rerender(<Harness mode="hidden" resolve={resolve} />)
    await act(async () => {
      await Promise.resolve()
    })
    rerender(<Harness mode="visible" resolve={resolve} />)

    // No "resolving" flash: the last known locations stay until the resolver emits again
    expect(screen.getByTestId('locations')).toHaveTextContent('resolved:1')

    act(() => locations$.next({locations: []}))
    expect(screen.getByTestId('locations')).toHaveTextContent('resolved:0')
  })
})
