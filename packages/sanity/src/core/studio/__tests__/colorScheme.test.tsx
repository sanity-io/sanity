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

  // The Lightning CSS toggle behaviour is covered by documentColorScheme.browser.test.ts; these
  // tests cover the color-scheme write and restore through the providers.
  describe('document color scheme sync', () => {
    afterEach(() => {
      document.documentElement.removeAttribute('style')
    })

    test('a fixed scheme is written to the document element', () => {
      render(
        <ColorSchemeProvider scheme="dark">
          <div data-testid="child">Test</div>
        </ColorSchemeProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    test('runtime scheme changes follow, and system leaves the document unset', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      setSnapshot('system')

      render(
        <ColorSchemeLocalStorageProvider>
          <ColorSchemeSetValueContext.Consumer>
            {(setValue) => (
              <>
                <Button
                  data-testid="to-light"
                  onClick={() => setValue && setValue('light')}
                  text="Light"
                />
                <Button
                  data-testid="to-system"
                  onClick={() => setValue && setValue('system')}
                  text="System"
                />
              </>
            )}
          </ColorSchemeSetValueContext.Consumer>
        </ColorSchemeLocalStorageProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('')

      await userEvent.click(screen.getByTestId('to-light'))
      expect(document.documentElement.style.colorScheme).toBe('light')

      await userEvent.click(screen.getByTestId('to-system'))
      expect(document.documentElement.style.colorScheme).toBe('')
    })

    test('a host-set color-scheme survives system mode and returns after a pinned scheme', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      setSnapshot('system')
      document.documentElement.style.colorScheme = 'dark'

      render(
        <ColorSchemeLocalStorageProvider>
          <ColorSchemeSetValueContext.Consumer>
            {(setValue) => (
              <>
                <Button
                  data-testid="to-light"
                  onClick={() => setValue && setValue('light')}
                  text="Light"
                />
                <Button
                  data-testid="to-system"
                  onClick={() => setValue && setValue('system')}
                  text="System"
                />
              </>
            )}
          </ColorSchemeSetValueContext.Consumer>
        </ColorSchemeLocalStorageProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('dark')

      await userEvent.click(screen.getByTestId('to-light'))
      expect(document.documentElement.style.colorScheme).toBe('light')

      await userEvent.click(screen.getByTestId('to-system'))
      expect(document.documentElement.style.colorScheme).toBe('dark')
    })

    test('a cold mount without a resolved store snapshot writes nothing', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      // a fresh module pair reproduces the first-ever render, where the store snapshot is
      // undefined until the subscribe effect initialises it
      vi.resetModules()
      const {ColorSchemeLocalStorageProvider: FreshProvider} = await import('../colorScheme')

      render(
        <FreshProvider>
          <div data-testid="child">Test</div>
        </FreshProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('')
    })
  })
})
