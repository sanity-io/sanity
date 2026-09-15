import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {Button} from '../../../ui-components/button/Button'
import {ColorSchemeLocalStorageProvider, ColorSchemeProvider} from '../colorScheme'
import {setSnapshot} from '../colorSchemeStore'
import {
  LIGHTNINGCSS_DARK_VARIABLE,
  LIGHTNINGCSS_LIGHT_VARIABLE,
  overrideLightDarkDownlevelForTests,
} from '../documentColorScheme'

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
    })
  })

  describe('document color scheme sync', () => {
    beforeEach(() => {
      overrideLightDarkDownlevelForTests(true)
    })

    afterEach(() => {
      overrideLightDarkDownlevelForTests(null)
      document.documentElement.removeAttribute('style')
    })

    test('a fixed scheme is written to the document element', () => {
      const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')

      render(
        <ColorSchemeProvider scheme="dark">
          <div data-testid="child">Test</div>
        </ColorSchemeProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('dark')
      expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_DARK_VARIABLE, 'initial')
      expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_LIGHT_VARIABLE, ' ')
    })

    test('runtime scheme changes follow, and system leaves the document unset', async () => {
      mockLocalStorage.getItem.mockReturnValue(null)
      setSnapshot('system')
      const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')

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
      expect(setProperty).not.toHaveBeenCalled()

      await userEvent.click(screen.getByTestId('to-light'))
      expect(document.documentElement.style.colorScheme).toBe('light')
      expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_LIGHT_VARIABLE, 'initial')
      expect(setProperty).toHaveBeenCalledWith(LIGHTNINGCSS_DARK_VARIABLE, ' ')

      await userEvent.click(screen.getByTestId('to-system'))
      expect(document.documentElement.style.colorScheme).toBe('')
      expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
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
      expect(document.documentElement.getAttribute('style') ?? '').not.toContain('lightningcss')
    })
  })
})
