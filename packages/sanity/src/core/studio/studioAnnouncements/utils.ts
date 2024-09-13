import {satisfies} from 'semver'

import {type StudioAnnouncementDocument} from './types'

/**
 * @internal
 * @hidden
 */
export function isValidAudience(
  document: StudioAnnouncementDocument,
  studioVersion: string,
): boolean {
  switch (document.audience) {
    case 'everyone':
      return true
    case 'specific-version':
      return satisfies(studioVersion, `= ${document.studioVersion}`, {
        includePrerelease: true,
      })
    case 'above-version':
      return satisfies(studioVersion, `> ${document.studioVersion}`, {
        includePrerelease: true,
      })
    case 'below-version':
      return satisfies(studioVersion, `< ${document.studioVersion}`, {
        includePrerelease: true,
      })
    default:
      return true
  }
}
