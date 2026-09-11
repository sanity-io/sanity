import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {Button} from '../../../ui-components/button/Button'
import {ColorSchemeLocalStorageProvider, ColorSchemeProvider} from '../colorScheme'
import {setSnapshot} from '../colorSchemeStore'

describe('ColorScheme', () => {
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
  }

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    })
    // Clear all mocks before each test
    vi.clearAllMocks()
    setSnapshot('system')
    document.documentElement.style.colorScheme = ''
  })

  afterEach(() => {
    document.documentElement.style.colorScheme = ''
  })

  describe('ColorSchemeProvider - smoke tests', () => {
    test('renders with default system scheme', () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      render(
        <ColorSchemeProvider>
          <div data-testid="child">Test</div>
        </ColorSchemeProvider>,
      )
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    test('renders with non default (dark) scheme', () => {
      render(
        <ColorSchemeProvider scheme="dark">
          <ColorSchemeValueContext.Consumer>
            {(value) => <div data-testid="scheme-value">{value}</div>}
          </ColorSchemeValueContext.Consumer>
        </ColorSchemeProvider>,
      )
      expect(screen.getByTestId('scheme-value')).toBeInTheDocument()
      expect(screen.getByTestId('scheme-value')).toHaveTextContent('dark')
    })
  })

  describe('ColorSchemeLocalStorageProvider', () => {
    test('persists scheme changes to localStorage', async () => {
      const onSchemeChange = vi.fn()
      render(
        <ColorSchemeLocalStorageProvider onSchemeChange={onSchemeChange}>
          <ColorSchemeValueContext.Consumer>
            {(value) => <div data-testid="scheme">{value}</div>}
          </ColorSchemeValueContext.Consumer>
          <ColorSchemeSetValueContext.Consumer>
            {(setValue) => (
              <Button
                data-testid="change-button"
                onClick={() => setValue && setValue('dark')}
                text="Change"
              />
            )}
          </ColorSchemeSetValueContext.Consumer>
        </ColorSchemeLocalStorageProvider>,
      )

      // Initial state
      expect(screen.getByTestId('scheme')).toHaveTextContent('system')

      // Change scheme
      await userEvent.click(screen.getByTestId('change-button'))
      expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
      expect(onSchemeChange).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sanityStudio:ui:colorScheme', 'dark')
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })
  })

  describe('document color-scheme sync', () => {
    test('writes the resolved scheme onto documentElement for ui5 light-dark()', () => {
      render(
        <ColorSchemeProvider scheme="dark">
          <div data-testid="child">Test</div>
        </ColorSchemeProvider>,
      )
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    test('leaves system unset so the OS can win', () => {
      render(
        <ColorSchemeProvider scheme="system">
          <div data-testid="child">Test</div>
        </ColorSchemeProvider>,
      )
      expect(document.documentElement.style.colorScheme).toBe('')
    })

    test('updates documentElement when the scheme changes', async () => {
      render(
        <ColorSchemeLocalStorageProvider>
          <ColorSchemeSetValueContext.Consumer>
            {(setValue) => (
              <Button
                data-testid="to-dark"
                onClick={() => setValue && setValue('dark')}
                text="Dark"
              />
            )}
          </ColorSchemeSetValueContext.Consumer>
        </ColorSchemeLocalStorageProvider>,
      )

      // `system` stays unset so `:root { color-scheme: light dark }` follows the OS
      expect(document.documentElement.style.colorScheme).toBe('')

      await userEvent.click(screen.getByTestId('to-dark'))
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    test('restores the previous document color-scheme on unmount', () => {
      document.documentElement.style.colorScheme = 'light'
      const {unmount} = render(
        <ColorSchemeProvider scheme="dark">
          <div>Test</div>
        </ColorSchemeProvider>,
      )
      expect(document.documentElement.style.colorScheme).toBe('dark')
      unmount()
      expect(document.documentElement.style.colorScheme).toBe('light')
    })
  })
})
