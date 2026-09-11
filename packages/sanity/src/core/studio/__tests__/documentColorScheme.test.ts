import {afterEach, describe, expect, test} from 'vitest'

import {applyDocumentColorScheme, applyStoredDocumentColorScheme} from '../documentColorScheme'

describe('documentColorScheme', () => {
  afterEach(() => {
    document.documentElement.style.colorScheme = ''
    localStorage.removeItem('sanityStudio:ui:colorScheme')
  })

  test('applyDocumentColorScheme sets and restores the inline color-scheme', () => {
    document.documentElement.style.colorScheme = 'light'
    const restore = applyDocumentColorScheme('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    restore()
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  test('applyDocumentColorScheme leaves system unset so the OS can win', () => {
    document.documentElement.style.colorScheme = 'dark'
    const restore = applyDocumentColorScheme('system')
    expect(document.documentElement.style.colorScheme).toBe('')
    restore()
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('applyStoredDocumentColorScheme applies a stored light or dark scheme', () => {
    localStorage.setItem('sanityStudio:ui:colorScheme', 'dark')
    applyStoredDocumentColorScheme()
    expect(document.documentElement.style.colorScheme).toBe('dark')
  })

  test('applyStoredDocumentColorScheme leaves system unset so the OS can win', () => {
    document.documentElement.style.colorScheme = ''
    localStorage.setItem('sanityStudio:ui:colorScheme', 'system')
    applyStoredDocumentColorScheme()
    expect(document.documentElement.style.colorScheme).toBe('')
  })
})
