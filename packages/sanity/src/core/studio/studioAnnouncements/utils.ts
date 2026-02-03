import {type Role} from '@sanity/types'
import {satisfies} from 'semver'

import {type AudienceRole, audienceRoles, type StudioAnnouncementDocument} from './types'

/**
 * @internal
 * @hidden
 */
export function isValidAnnouncementAudience(
  document: {
    audience: StudioAnnouncementDocument['audience']
    studioVersion: StudioAnnouncementDocument['studioVersion']
  },
  sanityVersion: string,
): boolean {
  switch (document.audience) {
    case 'everyone':
      return true
    case 'specific-version':
      return satisfies(sanityVersion, `= ${document.studioVersion}`, {
        includePrerelease: true,
      })
    case 'greater-than-or-equal-version':
      return satisfies(sanityVersion, `>= ${document.studioVersion}`, {
        includePrerelease: true,
      })
    case 'less-than-or-equal-version':
      return satisfies(sanityVersion, `<= ${document.studioVersion}`, {
        includePrerelease: true,
      })
    default:
      return true
  }
}

/**
 * @internal
 * @hidden
 */
export function isValidAnnouncementRole(
  audience: StudioAnnouncementDocument['audienceRole'] | undefined,
  userRoles: Role[] | undefined,
): boolean {
  if (!audience || !audience.length) return true
  if (!userRoles || !userRoles.length) return false

  if (userRoles.some((role) => audience.includes(role.name as AudienceRole))) return true

  // Check if the user has a custom role
  if (userRoles.some((role) => !audienceRoles.includes(role.name as AudienceRole))) {
    return audience.includes('custom')
  }
  return false
}
