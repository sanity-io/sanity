import {vi} from 'vitest'

export const mockTimeZoneData = {
  abbreviation: 'PDT',
  alternativeName: 'Pacific Daylight Time',
  city: 'Los Angeles',
  name: 'America/Los_Angeles',
  namePretty: 'America/Los_Angeles',
  offset: '-07:00',
  value: '-07:00 PDT America/Los_Angeles Pacific Daylight Time',
}

export const mockOsloTimeZoneData = {
  abbreviation: 'CET',
  alternativeName: 'Central European Time',
  city: 'Oslo',
  name: 'Europe/Oslo',
  namePretty: 'Europe/Oslo',
  offset: '+01:00',
  value: '+01:00 CET Europe/Oslo Central European Time',
}

export const mockTokyoTimeZoneData = {
  abbreviation: 'JST',
  alternativeName: 'Japan Standard Time',
  city: 'Tokyo',
  name: 'Asia/Tokyo',
  namePretty: 'Asia/Tokyo',
  offset: '+09:00',
  value: '+09:00 JST Asia/Tokyo Japan Standard Time',
}

export const baseTimeZoneHook = {
  setTimeZone: vi.fn(),
  formatDateTz: vi.fn(),
  getCurrentZoneDate: vi.fn(() => new Date()),
  utcToCurrentZoneDate: vi.fn((date) => date),
  zoneDateToUtc: vi.fn((date) => date),
  allTimeZones: [],
  getTimeZone: vi.fn(),
}

export const mockUseTimeZoneWithLA = {
  ...baseTimeZoneHook,
  timeZone: mockTimeZoneData,
  getLocalTimeZone: vi.fn(() => mockTimeZoneData),
}

export const mockUseTimeZoneWithOslo = {
  ...baseTimeZoneHook,
  timeZone: mockOsloTimeZoneData,
  getLocalTimeZone: vi.fn(() => mockOsloTimeZoneData),
}

export const mockUseTimeZoneWithTokyo = {
  ...baseTimeZoneHook,
  timeZone: mockTokyoTimeZoneData,
  getLocalTimeZone: vi.fn(() => mockTokyoTimeZoneData),
}

// Mock the useTimeZone hook
export const mockUseTimeZoneDefault = vi.fn().mockReturnValue(mockUseTimeZoneWithLA)
