import {format} from 'date-fns'
import {type RouterContextValue} from 'sanity/router'
import {describe, expect, it} from 'vitest'

import {
  buildReleasesSearchParams,
  getCardinalityViewFromUrl,
  getReleaseGroupModeFromUrl,
} from '../queryParamUtils'

const createMockRouter = (searchParams: string): RouterContextValue =>
  ({
    state: {
      _searchParams: searchParams,
    },
  }) as unknown as RouterContextValue

describe('queryParamUtils', () => {
  describe('getCardinalityViewFromUrl', () => {
    it('should return "releases" when scheduled drafts are disabled', () => {
      const searchParams: [string, string][] = [['view', 'drafts']]
      const result = getCardinalityViewFromUrl(searchParams, false)
      expect(result).toBe('releases')
    })

    it('should return "releases" by default when scheduled drafts are enabled', () => {
      const searchParams: [string, string][] = []
      const result = getCardinalityViewFromUrl(searchParams, true)
      expect(result).toBe('releases')
    })

    it('should return "drafts" when view param is "drafts" and scheduled drafts are enabled', () => {
      const searchParams: [string, string][] = [['view', 'drafts']]
      const result = getCardinalityViewFromUrl(searchParams, true)
      expect(result).toBe('drafts')
    })

    it('should return "releases" when view param is something else', () => {
      const searchParams: [string, string][] = [['view', 'something-else']]
      const result = getCardinalityViewFromUrl(searchParams, true)
      expect(result).toBe('releases')
    })
  })

  describe('getReleaseGroupModeFromUrl', () => {
    it('should return "active" by default', () => {
      const searchParams: [string, string][] = []
      const result = getReleaseGroupModeFromUrl(searchParams)
      expect(result).toBe('active')
    })

    it('should return "archived" when group param is "archived"', () => {
      const searchParams: [string, string][] = [['group', 'archived']]
      const result = getReleaseGroupModeFromUrl(searchParams)
      expect(result).toBe('archived')
    })

    it('should return "active" when group param is something else', () => {
      const searchParams: [string, string][] = [['group', 'something-else']]
      const result = getReleaseGroupModeFromUrl(searchParams)
      expect(result).toBe('active')
    })
  })

  describe('buildReleasesSearchParams', () => {
    it('should return empty array when no special params are needed', () => {
      const result = buildReleasesSearchParams(undefined, 'active', 'releases')
      expect(result).toEqual([])
    })

    it('should include date param when filter date is provided', () => {
      const date = new Date(2024, 0, 15)
      const expectedDateString = format(date, 'yyyy-MM-dd')
      const result = buildReleasesSearchParams(date, 'active', 'releases')
      expect(result).toEqual([['date', expectedDateString]])
    })

    it('should include group param when mode is archived', () => {
      const result = buildReleasesSearchParams(undefined, 'archived', 'releases')
      expect(result).toEqual([['group', 'archived']])
    })

    it('should include view param when cardinality view is drafts', () => {
      const result = buildReleasesSearchParams(undefined, 'active', 'drafts')
      expect(result).toEqual([['view', 'drafts']])
    })
  })
})
