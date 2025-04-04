import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {getSnapshot, setSnapshot, subscribe} from '../colorSchemeStore'

describe('colorSchemeStore', () => {
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

  afterEach(() => {
    // Reset the store state
    setSnapshot('system')
  })

  test('default color scheme is system', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    const unsubscribe = subscribe(() => {})
    expect(getSnapshot()).toBe('system')
    unsubscribe()
  })

  test('color scheme changes and persists', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribe(onChange)

    // Test dark mode
    setSnapshot('dark')
    expect(getSnapshot()).toBe('dark')
    expect(onChange).toHaveBeenCalled()

    // Test light mode
    setSnapshot('light')
    expect(getSnapshot()).toBe('light')
    expect(onChange).toHaveBeenCalled()

    // Test system mode
    setSnapshot('system')
    expect(getSnapshot()).toBe('system')
    expect(onChange).toHaveBeenCalled()

    unsubscribe()
  })

  test('invalid color scheme defaults to system', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribe(onChange)

    // @ts-expect-error Testing invalid input
    setSnapshot('invalid')
    expect(getSnapshot()).toBe('system')
    expect(onChange).toHaveBeenCalled()

    unsubscribe()
  })
})
