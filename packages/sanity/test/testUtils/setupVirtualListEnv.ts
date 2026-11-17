import {beforeEach, vi} from 'vitest'

// jsdom has no layout engine, so every element dimension reads 0 and a virtualizer renders no
// items. Stub the dimensions the virtualizer reads, for the scroll element only when a test id is
// given. `@tanstack/virtual-core` measures the viewport with `clientWidth` / `clientHeight`
// (excluding borders and scrollbars, since 3.19.6) and each row with `offsetWidth` /
// `offsetHeight`, so both pairs are stubbed. Not pretty, but it's what they recommend for
// testing outside of browsers: https://github.com/TanStack/virtual/issues/641
const SIZE_PROPERTIES = ['offsetHeight', 'offsetWidth', 'clientHeight', 'clientWidth'] as const

export const setupVirtualListEnv = (
  dataTestId?: string,
  rectWidth: number = 350,
  rectHeight: number = 800,
) => {
  beforeEach(() => {
    const originalDescriptors = SIZE_PROPERTIES.map(
      (property) =>
        [property, Object.getOwnPropertyDescriptor(HTMLElement.prototype, property)] as const,
    )

    for (const property of SIZE_PROPERTIES) {
      const size = property.endsWith('Height') ? rectHeight : rectWidth
      Object.defineProperty(HTMLElement.prototype, property, {
        configurable: true,
        get: vi.fn(function (this: Element) {
          if (!dataTestId || this.getAttribute('data-testid') === dataTestId) {
            return size
          }
          return 0
        }),
      })
    }

    return () => {
      for (const [property, descriptor] of originalDescriptors) {
        if (descriptor) {
          Object.defineProperty(HTMLElement.prototype, property, descriptor)
        } else {
          delete (HTMLElement.prototype as Partial<HTMLElement>)[property]
        }
      }
    }
  })
}
