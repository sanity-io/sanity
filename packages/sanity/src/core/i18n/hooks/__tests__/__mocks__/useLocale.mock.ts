import {type Mock, type Mocked, vi} from 'vitest'

import {type Locale} from '../../types'
import {useLocale, useCurrentLocale} from '../useLocale'

export const mockLocale: Locale = {id: 'en-US', title: 'English'}

export const useLocaleMockReturn: Mocked<ReturnType<typeof useLocale>> = {
  locales: [mockLocale],
  currentLocale: mockLocale,
  __internal: {i18next: {} as any},
  changeLocale: vi.fn(),
}

export const mockUseLocale = useLocale as Mock<typeof useLocale>
export const mockUseCurrentLocale = useCurrentLocale as Mock<typeof useCurrentLocale>
