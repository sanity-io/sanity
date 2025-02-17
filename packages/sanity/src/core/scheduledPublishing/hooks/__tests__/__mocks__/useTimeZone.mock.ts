import {type Mock, type Mocked, vi} from 'vitest'

import useTimeZone from '../../../../hooks/useTimeZone'
import {type NormalizedTimeZone} from '../../../types'

const mockTimeZone: NormalizedTimeZone = {
  abbreviation: 'SCT', // Sanity Central Time :)
  namePretty: 'Sanity/Oslo',
  offset: '+00:00',
  name: 'SCT',
  alternativeName: 'Sanity/Oslo',
  city: 'Oslo',
  value: 'SCT',
}

// default export
export const useTimeZoneMockReturn: Mocked<ReturnType<typeof useTimeZone>> = {
  zoneDateToUtc: vi.fn((date) => date),
  utcToCurrentZoneDate: vi.fn((date) => date),
  getCurrentZoneDate: vi.fn(() => new Date()),
  timeZone: mockTimeZone,
  setTimeZone: vi.fn(),
  formatDateTz: vi.fn(),
  allTimeZones: [],
  getLocalTimeZone: vi.fn(() => mockTimeZone),
  getTimeZone: vi.fn(),
}

// default export
export const mockUseTimeZone = useTimeZone as Mock<typeof useTimeZone>
