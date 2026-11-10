import {type ReleaseDocument} from '@sanity/client'
import {getVersionFromId} from '@sanity/client/csm'
import {type DocumentSystem} from '@sanity/types'

import {randomKey} from '../../form/utils/randomKey'
import {isAgentBundleName} from '../../store/agent/createAgentBundlesStore'
import {getPublishedId, isDraftId} from '../../util/draftUtils'
import {type VersionInfoDocumentStub} from '../store/types'
import {getReleaseDocumentIdFromReleaseId} from './getReleaseDocumentIdFromReleaseId'
import {getReleaseIdFromReleaseDocumentId} from './getReleaseIdFromReleaseDocumentId'

/**
 * Temporarily builds the document _system for a given document id.
 * This is used until the documents are migrated to the new _system.
 * And only if the documents are not variant documents.
 *
 * Variants will include the _system field.
 *
 * With `releases`, a `versions.<release>.<id>` document references its release only when that
 * release is in the list. Without them (`undefined`: the caller does not know the releases), it
 * references the release its id names, except for agent bundles, which are not releases.
 *
 * @internal
 */
export function buildDocumentSystem(
  id: string,
  releases: ReleaseDocument[] | undefined,
): DocumentSystem {
  const versionId = getVersionFromId(id)
  if (versionId) {
    return {
      bundleId: versionId,
      release: getReleaseRef(versionId, releases),
      group: {
        _ref: getPublishedId(id),
        _weak: true,
      },
      scopeId: versionId,
    }
  }

  return {
    bundleId: isDraftId(id) ? 'drafts' : undefined,
    group: {_ref: getPublishedId(id), _weak: true},
  }
}

function getReleaseRef(
  versionId: string,
  releases: ReleaseDocument[] | undefined,
): DocumentSystem['release'] {
  if (!releases) {
    return isAgentBundleName(versionId)
      ? undefined
      : {_ref: getReleaseDocumentIdFromReleaseId(versionId), _weak: true}
  }

  const releaseDocument = releases.find(
    (release) => getReleaseIdFromReleaseDocumentId(release._id) === versionId,
  )
  return releaseDocument ? {_ref: releaseDocument._id, _weak: true} : undefined
}

/**
 * Canonicalizes the variant reference to `_system.variants`: documents that have not been
 * migrated yet carry the legacy single `_system.variant` reference, which is folded into the
 * array so every stub consumer can read `variants[0]`.
 */
function normalizeVariants(system: DocumentSystem): DocumentSystem {
  // oxlint-disable-next-line typescript/no-deprecated - we need to destructure the variant fallback field.
  const {variant, ...rest} = system
  // Document has the new shape, remove legacy field and return the rest.
  if (system.variants?.[0]) return rest

  // Document has the legacy shape, create the variants array with the legacy variant reference, strips the legacy field.
  if (variant) {
    return {...rest, variants: [{_ref: variant._ref, _key: randomKey()}]}
  }

  // Document has no variant reference, return the rest.
  return rest
}

/**
 * `_system` as a raw query returns it: any subset of the typed fields, `null`, or fields the type
 * does not declare (published documents carry `{base: {id, rev}}`).
 *
 * @internal
 */
export type RawDocumentSystem =
  | Partial<DocumentSystem>
  | (Partial<DocumentSystem> & {[field: string]: unknown})

/**
 * The `_system` of a version as every stub consumer reads it. Content Lake only stores
 * `_system.group` on variant versions today: published documents carry `{base}` at most, classic
 * drafts carry none, and release versions lack the group. For those, the missing fields are
 * built from the id (see {@link buildDocumentSystem}), on top of whatever `_system` the document
 * has.
 *
 * @internal
 */
export function resolveVersionSystem(
  version: Pick<VersionInfoDocumentStub, '_id'> & {_system?: RawDocumentSystem | null},
  releases: ReleaseDocument[] | undefined,
): DocumentSystem {
  const group = version._system?.group
  if (group) return normalizeVariants({...version._system, group})

  return normalizeVariants({
    ...version._system,
    ...buildDocumentSystem(version._id, releases),
  })
}
