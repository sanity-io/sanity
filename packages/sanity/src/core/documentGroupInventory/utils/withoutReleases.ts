import {toVersionStub} from '../../inventoryModel/buildInventoryIndex'
import {type ReleasesReducerState} from '../../releases/store/reducer'
import {getReleaseDocumentIdFromReleaseId} from '../../releases/util/getReleaseDocumentIdFromReleaseId'
import {isCardinalityOneRelease} from '../../util/releaseUtils'
import {type Meta} from '../machines/documentGroupInventoryMachine'

/**
 * The releases a workspace with content releases off may still show: scheduled drafts only.
 *
 * @internal
 */
export function withoutReleases(state: ReleasesReducerState): ReleasesReducerState {
  const releases = new Map(
    [...state.releases].filter(([, release]) => isCardinalityOneRelease(release)),
  )
  return {...state, releases}
}

/**
 * The inventory's inputs with content releases off: release versions are left out, as the
 * navbar leaves out the releases. Published, drafts, scheduled drafts, variants and agent
 * bundles stay. A version whose release is not loaded (or no longer exists) is left out too.
 *
 * @internal
 */
export function metaWithoutReleases(meta: Meta): Meta {
  const releasesState = withoutReleases(meta.releases)
  // Release bundle of each version in a release (by id); every other version stays.
  const releaseBundles = new Map(
    meta.versionState.versions.flatMap((version) => {
      const stub = toVersionStub(version)
      return stub?.kind === 'release' ? [[stub._id, stub.bundle] as const] : []
    }),
  )
  const keep = (id: string) => {
    const bundle = releaseBundles.get(id)
    return (
      bundle === undefined ||
      releasesState.releases.has(bundle) ||
      releasesState.releases.has(getReleaseDocumentIdFromReleaseId(bundle))
    )
  }
  return {
    ...meta,
    releases: releasesState,
    versionState: {
      ...meta.versionState,
      data: meta.versionState.data.filter(keep),
      versions: meta.versionState.versions.filter((version) => keep(version._id)),
    },
  }
}
