import {type Reference} from '@sanity/types'
import {act, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {of, Subject} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {WithReferencedAsset} from '../WithReferencedAsset'

interface AssetStub {
  title: string
}

const reference = {_type: 'reference', _ref: 'image-abc'} as const

/**
 * Suspense recovery requires the initial render to happen inside an awaited
 * `act` — otherwise React never attaches the promise ping and the boundary
 * stays stuck on the fallback (same pattern as the react-rx test suite).
 */
async function renderAsync(ui: ReactNode) {
  let result!: ReturnType<typeof render>
  // oxlint-disable-next-line testing-library/no-unnecessary-act
  await act(async () => {
    result = render(ui)
  })
  return result
}

describe('WithReferencedAsset', () => {
  it('renders children immediately when the asset observable emits synchronously', async () => {
    await renderAsync(
      <WithReferencedAsset
        reference={reference}
        observeAsset={() => of<AssetStub>({title: 'cat.png'})}
        waitPlaceholder={<div data-testid="placeholder" />}
      >
        {(asset) => <div data-testid="asset">{asset.title}</div>}
      </WithReferencedAsset>,
    )

    expect(screen.getByTestId('asset').textContent).toBe('cat.png')
    expect(screen.queryByTestId('placeholder')).toBeNull()
  })

  it('renders the wait placeholder until the asset arrives', async () => {
    const asset$ = new Subject<AssetStub>()

    await renderAsync(
      <WithReferencedAsset
        reference={reference}
        observeAsset={() => asset$}
        waitPlaceholder={<div data-testid="placeholder" />}
      >
        {(asset) => <div data-testid="asset">{asset.title}</div>}
      </WithReferencedAsset>,
    )

    expect(screen.getByTestId('placeholder')).toBeTruthy()
    expect(screen.queryByTestId('asset')).toBeNull()

    await act(async () => {
      asset$.next({title: 'dog.png'})
    })

    expect(await screen.findByTestId('asset')).toHaveTextContent('dog.png')
    expect(screen.queryByTestId('placeholder')).toBeNull()
  })

  it('updates children on later emissions without going back to the placeholder', async () => {
    const asset$ = new Subject<AssetStub>()

    await renderAsync(
      <WithReferencedAsset
        reference={reference}
        observeAsset={() => asset$}
        waitPlaceholder={<div data-testid="placeholder" />}
      >
        {(asset) => <div data-testid="asset">{asset.title}</div>}
      </WithReferencedAsset>,
    )

    await act(async () => {
      asset$.next({title: 'v1.png'})
    })
    expect(await screen.findByTestId('asset')).toHaveTextContent('v1.png')

    await act(async () => {
      asset$.next({title: 'v2.png'})
    })
    expect(await screen.findByTestId('asset')).toHaveTextContent('v2.png')
    expect(screen.queryByTestId('placeholder')).toBeNull()
  })

  it('keeps the wait placeholder when the asset emission is null (missing document)', async () => {
    const asset$ = new Subject<AssetStub | null>()

    await renderAsync(
      <WithReferencedAsset
        reference={reference}
        observeAsset={() => asset$}
        waitPlaceholder={<div data-testid="placeholder" />}
      >
        {(asset) => <div data-testid="asset">{asset?.title}</div>}
      </WithReferencedAsset>,
    )

    // observePaths-based sources emit null while the referenced document is
    // missing or not yet indexed — the placeholder must stay up instead of
    // handing null to children.
    await act(async () => {
      asset$.next(null)
    })
    expect(screen.getByTestId('placeholder')).toBeTruthy()
    expect(screen.queryByTestId('asset')).toBeNull()

    await act(async () => {
      asset$.next({title: 'late.png'})
    })
    expect(await screen.findByTestId('asset')).toHaveTextContent('late.png')
    expect(screen.queryByTestId('placeholder')).toBeNull()
  })

  it('renders the wait placeholder and never calls observeAsset when the reference has no _ref', async () => {
    const asset$ = new Subject<AssetStub>()
    // Implementations like observeVideoAsset parse the id synchronously at
    // call time, so calling observeAsset without an id could throw in render.
    const observeAsset = vi.fn(() => asset$)

    await renderAsync(
      <WithReferencedAsset
        // Defensive: some callers pass incomplete reference values while an
        // upload is still in flight.
        reference={{_type: 'reference'} as Reference}
        observeAsset={observeAsset}
        waitPlaceholder={<div data-testid="placeholder" />}
      >
        {(asset: AssetStub) => <div data-testid="asset">{asset.title}</div>}
      </WithReferencedAsset>,
    )

    expect(screen.getByTestId('placeholder')).toBeTruthy()
    expect(screen.queryByTestId('asset')).toBeNull()
    expect(observeAsset).not.toHaveBeenCalled()
  })
})
