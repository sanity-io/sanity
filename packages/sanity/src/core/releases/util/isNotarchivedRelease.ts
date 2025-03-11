import {type ReleaseDocument, type ReleaseState} from '../store/types'

/** @internal */
export type NotArchivedRelease = ReleaseDocument & {state: Exclude<ReleaseState, 'archived'>}

/** @internal */
export function isNotArchivedRelease(release: ReleaseDocument): release is NotArchivedRelease {
  return release.state !== 'archived'
}
