// oxlint-disable no-extend-native
import {beforeEach, vi} from 'vitest'

export const setupVirtualListEnv = (
  dataTestId?: string,
  rectWidth: number = 350,
  rectHeight: number = 800,
) => {
  beforeEach(() => {
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight',
    )
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth',
    )
    // Virtual list will return an empty list of items unless we have some size,
    // so we need to mock offsetHeight and offsetWidth to return a size for the list.
    // Not pretty, but it's what they recommend for testing outside of browsers:
    // https://github.com/TanStack/virtual/issues/641
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get: vi.fn(function (this: Element) {
        if (!dataTestId || this.getAttribute('data-testid') === dataTestId) {
          return rectHeight
        }
        return 0
      }),
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get: vi.fn(function (this: Element) {
        if (!dataTestId || this.getAttribute('data-testid') === dataTestId) {
          return rectWidth
        }
        return 0
      }),
    })

    return () => {
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
      if (originalOffsetWidth) {
        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', originalOffsetWidth)
      }
    }
  })
}
