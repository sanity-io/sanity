import {studioTheme, ThemeProvider} from '@sanity/ui'
import {renderHook} from '@testing-library/react'
import {beforeAll, beforeEach, describe, expect, it} from 'vitest'

import {LocaleProviderBase, usEnglishLocale} from '../../i18n'
import {studioDefaultLocaleResources} from '../../i18n/bundles/studio'
import {prepareI18n} from '../../i18n/i18nConfig'
import {useListFormat} from '../useListFormat'

const frenchLocale = {
  id: 'fr-FR',
  title: 'Français',
  weekInfo: {firstDay: 1, minimalDays: 2, weekend: [6, 7]},
}

describe('useListFormat', () => {
  const {i18next} = prepareI18n({
    projectId: 'test',
    dataset: 'test',
    name: 'test',
    i18n: {bundles: [studioDefaultLocaleResources]},
  })

  const wrapper = ({children}: {children: React.ReactNode}) => (
    <ThemeProvider theme={studioTheme}>
      <LocaleProviderBase
        locales={[usEnglishLocale, frenchLocale]}
        i18next={i18next}
        projectId="test"
        sourceId="test"
      >
        {children}
      </LocaleProviderBase>
    </ThemeProvider>
  )

  beforeAll(() => i18next.init())
  beforeEach(() => i18next.changeLanguage('en-US'))

  it('formats lists using the active locale', async () => {
    await i18next.changeLanguage('fr-FR')
    const {result} = renderHook(() => useListFormat(), {wrapper})
    expect(result.current.format(['a', 'b', 'c'])).toBe('a, b et c')
  })

  it('falls back to en-US narrow style when no provider', () => {
    const {result} = renderHook(() => useListFormat())
    expect(result.current.format(['a', 'b', 'c'])).toBe('a, b, c')
  })

  it('respects options passed in', () => {
    const {result} = renderHook(() => useListFormat({style: 'short', type: 'disjunction'}), {
      wrapper,
    })
    expect(result.current.format(['a', 'b', 'c'])).toBe('a, b, ou c')
  })
})
