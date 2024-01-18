import path from 'path'
import dotenv from 'dotenv'

// eslint-disable-next-line no-process-env
process.env.FORCE_COLOR = '0'

dotenv.config({path: path.resolve(__dirname, '../.env')})

if (typeof window !== 'undefined') {
  // https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    value: class IntersectionObserver {
      observe = jest.fn()
      unobserve = jest.fn()
      disconnect = jest.fn()
    },
  })

  jest.mock('@sanity/ui', () => {
    // causes `ResizeObserver` not found errors
    const sanityUi = jest.requireActual('@sanity/ui')
    const mockDomRect: DOMRectReadOnly = {
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }

    return {...sanityUi, useElementRect: jest.fn(() => mockDomRect)}
  })
}
