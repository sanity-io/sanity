import {format} from 'date-fns/format'
import {type RouterContextValue} from 'sanity/router'
import {describe, expect, it} from 'vitest'

import {
  buildReleasesSearchParams,
  getInitialCardinalityView,
  getInitialReleaseNotFound,
} from '../queryParamUtils'

const createMockRouter = (searchParams: string): RouterContextValue =>
  ({
    state: {
      _searchParams: searchParams,
    },
  }) as unknown as RouterContextValue

describe('queryParamUtils', () => {
  describe('getInitialCardinalityView', () => {
    it('should return "releases" by default when both features are enabled', () => {
      const router = createMockRouter('')
      const result = getInitialCardinalityView({
        router,
        isScheduledDraftsEnabled: true,
        isReleasesEnabled: true,
      })()
      expect(result).toBe('releases')
    })

    it('should return "drafts" when view param is "drafts" and both features are enabled', () => {
      const router = createMockRouter('view=drafts')
      const result = getInitialCardinalityView({
        router,
        isScheduledDraftsEnabled: true,
        isReleasesEnabled: true,
      })()
      expect(result).toBe('drafts')
    })

    it('should return "releases" when scheduled drafts is disabled', () => {
      const router = createMockRouter('view=drafts')
      const result = getInitialCardinalityView({
        router,
        isScheduledDraftsEnabled: false,
        isReleasesEnabled: true,
      })()
      expect(result).toBe('releases')
    })

    it('should return "drafts" when releases is disabled', () => {
      const router = createMockRouter('view=releases')
      const result = getInitialCardinalityView({
        router,
        isScheduledDraftsEnabled: true,
        isReleasesEnabled: false,
      })()
      expect(result).toBe('drafts')
    })

    it('should return "releases" when both features are disabled', () => {
      const router = createMockRouter('view=drafts')
      const result = getInitialCardinalityView({
        router,
        isScheduledDraftsEnabled: false,
        isReleasesEnabled: false,
      })()
      expect(result).toBe('releases')
    })
  })

  describe('getInitialReleaseNotFound', () => {
    it('should return true when releaseNotFound=true is in search params', () => {
      const router = createMockRouter('releaseNotFound=true')
      expect(getInitialReleaseNotFound(router)).toBe(true)
    })

    it('should return false when param is absent', () => {
      const router = createMockRouter('')
      expect(getInitialReleaseNotFound(router)).toBe(false)
    })

    it('should return false when param value is not "true"', () => {
      const router = createMockRouter('releaseNotFound=false')
      expect(getInitialReleaseNotFound(router)).toBe(false)
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
