import {fireEvent, render, screen} from '@testing-library/react'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {Button} from '../../../ui-components/button/Button'
import {ColorSchemeLocalStorageProvider, ColorSchemeProvider} from '../colorScheme'

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
    test('persists scheme changes to localStorage', () => {
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
      fireEvent.click(screen.getByTestId('change-button'))
      expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
      expect(onSchemeChange).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('sanityStudio:ui:colorScheme', 'dark')
    })
  })
})
