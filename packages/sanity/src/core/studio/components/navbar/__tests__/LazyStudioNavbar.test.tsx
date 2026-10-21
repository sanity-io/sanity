import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {render, screen} from '@testing-library/react'
import {type ReactNode, Suspense} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {LazyStudioNavbar} from '../LazyStudioNavbar'

// Keeps the navbar chunk pending until the test resolves it, so both states are observable.
const studioNavbarModule = vi.hoisted(() => {
  let resolve!: (module: {default: () => ReactNode}) => void
  const promise = new Promise<{default: () => ReactNode}>((_resolve) => {
    resolve = _resolve
  })
  return {promise, resolve}
})

vi.mock('../StudioNavbar.lazy', () => studioNavbarModule.promise)

const theme = buildTheme()

function wrapper({children}: {children: ReactNode}) {
  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback={<div data-testid="ancestor-fallback" />}>{children}</Suspense>
    </ThemeProvider>
  )
}

describe('LazyStudioNavbar', () => {
  it('suspends to the ancestor boundary rather than reserving a navbar-shaped row', async () => {
    render(<LazyStudioNavbar />, {wrapper})

    // No fallback of its own: the navbar's height, tone and layering depend on what it renders,
    // so it suspends up to StudioLayout's loading screen instead of painting a mismatched bar.
    expect(screen.getByTestId('ancestor-fallback')).toBeInTheDocument()

    studioNavbarModule.resolve({
      default: () => <div data-testid="studio-navbar" />,
    })

    expect(await screen.findByTestId('studio-navbar')).toBeInTheDocument()
    expect(screen.queryByTestId('ancestor-fallback')).not.toBeInTheDocument()
  })
})
