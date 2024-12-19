import {afterEach, beforeEach, vi} from 'vitest'

export const setupVirtualisedEnvironment = (
  dataTestId?: string,
  rectWidth: number = 350,
  rectHeight: number = 800,
) => {
  const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect

  const getDOMRect = (width: number, height: number) => ({
    width,
    height,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  })

  beforeEach(() => {
    // Virtual list will return an empty list of items unless we have some size,
    // so we need to mock getBoundingClientRect to return a size for the list.
    // Not pretty, but it's what they recommend for testing outside of browsers:
    // https://github.com/TanStack/virtual/issues/641
    Element.prototype.getBoundingClientRect = vi.fn(function (this: Element) {
      if (!dataTestId || this.getAttribute('data-testid') === dataTestId) {
        return getDOMRect(rectWidth, rectHeight)
      }
      return getDOMRect(0, 0)
    })
  })

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect
  })
}
