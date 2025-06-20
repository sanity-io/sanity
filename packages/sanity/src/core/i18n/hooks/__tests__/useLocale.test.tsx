import {renderHook} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'

import {LocaleContext} from 'sanity/_singletons'
import {useLocale, useCurrentLocale} from '../useLocale'

const wrapper = ({children}: {children: React.ReactNode}) => {
  const value = {
    locales: [{id: 'en-US', title: 'English'}],
    currentLocale: {id: 'en-US', title: 'English'},
    __internal: {i18next: {} as any},
    changeLocale: vi.fn(),
  }
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

describe('useLocale', () => {
  it('returns context value', () => {
    const {result} = renderHook(() => useLocale(), {wrapper})
    expect(result.current.currentLocale.id).toBe('en-US')
  })

  it('throws if context missing', () => {
    expect(() => renderHook(() => useLocale())).toThrow('Sanity LocaleContext value missing')
  })
})

describe('useCurrentLocale', () => {
  it('returns current locale', () => {
    const {result} = renderHook(() => useCurrentLocale(), {wrapper})
    expect(result.current.id).toBe('en-US')
  })
})
