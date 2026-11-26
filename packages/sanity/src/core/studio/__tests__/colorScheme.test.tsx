import {act, render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {Suspense} from 'react'
import {hydrateRoot} from 'react-dom/client'
import {renderToString} from 'react-dom/server'
import {ColorSchemeSetValueContext, ColorSchemeValueContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, onTestFinished, test, vi} from 'vitest'

import {stubMessageBusHost} from '../../../../test/testUtils/stubMessageBusHost'
import {Button} from '../../../ui-components/button/Button'
import {ColorSchemeLocalStorageProvider, ColorSchemeProvider} from '../colorScheme'

function SchemeProbe() {
  return (
    <ColorSchemeSetValueContext.Consumer>
      {(setValue) => (
        <ColorSchemeValueContext.Consumer>
          {(value) => (
            <div data-testid="scheme" data-can-change={String(Boolean(setValue))}>
              {value}
            </div>
          )}
        </ColorSchemeValueContext.Consumer>
      )}
    </ColorSchemeSetValueContext.Consumer>
  )
}

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

    test('a cold mount with nothing stored writes nothing', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      render(
        <ColorSchemeLocalStorageProvider>
          <div data-testid="child">Test</div>
        </ColorSchemeLocalStorageProvider>,
      )

      expect(document.documentElement.style.colorScheme).toBe('')
    })
  })

  describe('ColorSchemeProvider with a message bus host', () => {
    test('follows the scheme the host publishes and offers no way to change it', () => {
      const host = stubMessageBusHost()
      host.publish('preferences.color-scheme', 'dark')
      const onSchemeChange = vi.fn()

      render(
        <ColorSchemeProvider onSchemeChange={onSchemeChange}>
          <SchemeProbe />
        </ColorSchemeProvider>,
      )
      expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
      expect(screen.getByTestId('scheme')).toHaveAttribute('data-can-change', 'false')

      act(() => host.publish('preferences.color-scheme', 'light'))

      expect(screen.getByTestId('scheme')).toHaveTextContent('light')
      expect(onSchemeChange.mock.calls).toEqual([['dark'], ['light']])
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    test('leaves the document scheme to the host', () => {
      const host = stubMessageBusHost()
      host.publish('preferences.color-scheme', 'dark')
      document.documentElement.style.colorScheme = 'dark'
      onTestFinished(() => document.documentElement.removeAttribute('style'))
      const {unmount} = render(
        <ColorSchemeProvider>
          <SchemeProbe />
        </ColorSchemeProvider>,
      )

      // The host pins the document to its new scheme as it publishes it.
      act(() => {
        host.publish('preferences.color-scheme', 'light')
        document.documentElement.style.colorScheme = 'light'
      })
      unmount()

      expect(document.documentElement.style.colorScheme).toBe('light')
    })

    test('follows the system scheme until the host publishes one', () => {
      stubMessageBusHost()

      render(
        <ColorSchemeProvider>
          <SchemeProbe />
        </ColorSchemeProvider>,
      )

      expect(screen.getByTestId('scheme')).toHaveTextContent('system')
    })

    test('a scheme prop still wins over the host', () => {
      stubMessageBusHost().publish('preferences.color-scheme', 'dark')

      render(
        <ColorSchemeProvider scheme="light">
          <SchemeProbe />
        </ColorSchemeProvider>,
      )

      expect(screen.getByTestId('scheme')).toHaveTextContent('light')
    })
  })

  describe('server rendering', () => {
    test('suspends on the server, so a server render needs a Suspense boundary above it', () => {
      expect(() =>
        renderToString(
          <ColorSchemeProvider>
            <SchemeProbe />
          </ColorSchemeProvider>,
        ),
      ).toThrow(/client rendering was requested outside a Suspense boundary/)
    })

    test('the server renders the fallback, and hydration renders the stored scheme', async () => {
      const consoleError = vi.spyOn(console, 'error')
      mockLocalStorage.getItem.mockReturnValue('dark')
      const node = document.createElement('div')
      document.body.appendChild(node)
      onTestFinished(() => node.remove())
      const app = (
        <Suspense fallback={null}>
          <ColorSchemeProvider>
            <SchemeProbe />
          </ColorSchemeProvider>
        </Suspense>
      )

      node.innerHTML = renderToString(app)
      expect(node.querySelector('[data-testid="scheme"]')).toBeNull()

      const root = await act(() => hydrateRoot(node, app))
      onTestFinished(() => act(() => root.unmount()))

      expect(screen.getByTestId('scheme')).toHaveTextContent('dark')
      expect(consoleError).not.toHaveBeenCalled()
    })
  })
})
