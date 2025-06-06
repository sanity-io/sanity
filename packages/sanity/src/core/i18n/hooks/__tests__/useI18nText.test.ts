import {renderHook} from '@testing-library/react'
import {describe, it, expect, vi} from 'vitest'

import {useI18nText} from '../useI18nText'
import {useTranslation} from '../useTranslation'

vi.mock('../useTranslation', () => ({useTranslation: vi.fn()}))

const mockUseTranslation = useTranslation as unknown as ReturnType<typeof vi.fn>

const node = {
  title: 'Title',
  i18n: {title: {key: 'titleKey', ns: 'test'}},
}

describe('useI18nText', () => {
  it('returns translated values', () => {
    mockUseTranslation.mockReturnValue({t: vi.fn(() => 'Translated')})
    const {result} = renderHook(() => useI18nText(node))
    expect(result.current.title).toBe('Translated')
  })

  it('falls back to default', () => {
    mockUseTranslation.mockReturnValue({t: vi.fn(() => 'Default')})
    const {result} = renderHook(() => useI18nText({label: 'Label'} as any))
    expect(result.current.label).toBe('Label')
  })
})
