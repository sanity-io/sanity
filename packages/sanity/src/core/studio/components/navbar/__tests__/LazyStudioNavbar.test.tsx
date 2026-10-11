import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {LazyStudioNavbar} from '../LazyStudioNavbar'

// Keeps the navbar chunk pending until the test resolves it, so both states of the boundary are
// observable.
const studioNavbarModule = vi.hoisted(() => {
  let resolve!: (module: {StudioNavbar: () => ReactNode}) => void
  const promise = new Promise<{StudioNavbar: () => ReactNode}>((_resolve) => {
    resolve = _resolve
  })
  return {promise, resolve}
})

vi.mock('../StudioNavbar', () => studioNavbarModule.promise)

const theme = buildTheme()

function wrapper({children}: {children: ReactNode}) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

describe('LazyStudioNavbar', () => {
  it('reserves the navbar row while the chunk loads, then renders the navbar', async () => {
    render(<LazyStudioNavbar />, {wrapper})

    const fallback = screen.getByTestId('studio-navbar-loading')
    expect(fallback).toBeInTheDocument()

    // The reserved row is a real button rather than a fixed pixel height, hidden from the tab
    // order and the accessibility tree.
    const hiddenRow = fallback.querySelector('[aria-hidden="true"]')
    expect(hiddenRow).not.toBeNull()
    expect(hiddenRow).toHaveStyle({visibility: 'hidden'})
    expect(hiddenRow?.querySelector('button')).not.toBeNull()

    studioNavbarModule.resolve({
      StudioNavbar: () => <div data-testid="studio-navbar" />,
    })

    expect(await screen.findByTestId('studio-navbar')).toBeInTheDocument()
    expect(screen.queryByTestId('studio-navbar-loading')).not.toBeInTheDocument()
  })
})
