import {describe, expect, test} from '@jest/globals'

import {isValidAnnouncementAudience, isValidAnnouncementRole} from '../utils'

describe('isValidAnnouncementRole', () => {
  const userRoles = [
    {name: 'developer', title: 'Developer'},
    {name: 'administrator', title: 'Administrator'},
  ]

  test('returns true when audienceRole is undefined', () => {
    expect(isValidAnnouncementRole(undefined, userRoles)).toBe(true)
  })
  test('returns true when user is undefined', () => {
    expect(isValidAnnouncementRole(['administrator'], undefined)).toBe(false)
    expect(isValidAnnouncementRole(['administrator'], [])).toBe(false)
  })
  test("returns true if the user's role is in the audienceRole", () => {
    expect(isValidAnnouncementRole(['administrator'], userRoles)).toBe(true)
  })
  test("returns true if the user's role is in the audienceRole", () => {
    expect(isValidAnnouncementRole(['developer', 'custom'], userRoles)).toBe(true)
  })
  test("returns false if the user's role is not in the audienceRole", () => {
    expect(isValidAnnouncementRole(['editor'], userRoles)).toBe(false)
  })
  test("returns false if the user's role is not in the audienceRole", () => {
    expect(isValidAnnouncementRole(['editor'], [{name: 'foo', title: 'Custom foo role'}])).toBe(
      false,
    )
  })
  test('returns false if the user has a custom role and we aim custom roles', () => {
    expect(
      isValidAnnouncementRole(
        ['custom'],
        [...userRoles, {name: 'foo', title: 'A custom foo role'}],
      ),
    ).toBe(true)
  })
})

describe('isValidAnnouncementAudience', () => {
  test('should return true when audience is "everyone"', () => {
    const announcement = {audience: 'everyone', studioVersion: undefined} as const
    const sanityVersion = '3.55.0'
    expect(isValidAnnouncementAudience(announcement, sanityVersion)).toBe(true)
  })

  describe('when audience is "specific-version"', () => {
    const document = {audience: 'specific-version', studioVersion: '3.55.0'} as const
    test('should return true when versions match', () => {
      const sanityVersion = '3.55.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(true)
    })

    test('should return false when versions do not match', () => {
      const sanityVersion = '3.56.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(false)
    })
  })

  describe('when audience is "above-version"', () => {
    const document = {audience: 'above-version', studioVersion: '3.55.0'} as const
    test('should return true when sanityVersion is above document.studioVersion', () => {
      const sanityVersion = '3.56.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(true)
    })

    test('should return false when sanityVersion is equal to document.studioVersion', () => {
      const sanityVersion = '3.55.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(false)
    })

    test('should return false when sanityVersion is below document.studioVersion', () => {
      const sanityVersion = '3.54.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(false)
    })
  })
  describe('when audience is "below-version"', () => {
    const document = {audience: 'below-version', studioVersion: '3.55.0'} as const
    test('should return false when sanityVersion is above document.studioVersion', () => {
      const sanityVersion = '3.56.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(false)
    })

    test('should return false when sanityVersion is equal to document.studioVersion', () => {
      const sanityVersion = '3.55.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(false)
    })

    test('should return true when sanityVersion is below document.studioVersion', () => {
      const sanityVersion = '3.54.0'
      expect(isValidAnnouncementAudience(document, sanityVersion)).toBe(true)
    })
  })
})
