// get rid of context warning
const warn = console.warn
window.console = {
  ...window.console,
  warn: (...args: any[]) => {
    if (!/No context provided/.test(args[0])) {
      warn(...args)
    }
  },
}

// IntersectionObserver isn't available in the test browser environment
const mockIntersectionObserver = jest.fn()
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
})
window.IntersectionObserver = mockIntersectionObserver

// ResizeObserver isn't available in the test browser environment
const mockResizeObserver = jest.fn()
mockResizeObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
})
window.ResizeObserver = mockResizeObserver
