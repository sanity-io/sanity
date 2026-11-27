import {type ReleaseId} from '../perspective/types'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {isGoingToUnpublish} from '../releases/util/isGoingToUnpublish'
import {isSystemBundle} from '../util/draftUtils'

interface ResolveStackedVersionScopeIdOptions {
  releaseId: ReleaseId | undefined
  hasSelectedReleaseVersion: boolean
  perspectiveStack: readonly string[]
  documentVersionStubs: VersionInfoDocumentStub[]
}

export function resolveStackedVersionScopeId(
  options: ResolveStackedVersionScopeIdOptions,
): string | undefined {
  const {releaseId, hasSelectedReleaseVersion, perspectiveStack, documentVersionStubs} = options
  if (!releaseId || isSystemBundle(releaseId) || hasSelectedReleaseVersion) return undefined

  const selectedIndex = perspectiveStack.indexOf(releaseId)
  if (selectedIndex === -1) return undefined

  const firstStop = perspectiveStack
    .slice(selectedIndex + 1)
    .find(
      (perspective) =>
        isSystemBundle(perspective) ||
        documentVersionStubs.some((stub) => stub._system?.bundleId === perspective),
    )
  if (!firstStop || isSystemBundle(firstStop)) return undefined

  const firstStopStub = documentVersionStubs.find((stub) => stub._system?.bundleId === firstStop)
  return firstStopStub && isGoingToUnpublish(firstStopStub) ? undefined : firstStop
}
