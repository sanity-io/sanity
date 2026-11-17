import {isErrorWithDetails} from '../../error/types/isErrorWithDetails'
import {getPublishedId} from '../../util/draftUtils'

interface ActionErrorEntry {
  type?: string
  referencingIDs?: unknown
}

interface ActionErrorDetails extends ActionErrorEntry {
  items?: Array<{error?: ActionErrorEntry}>
}

/**
 * The actions API reports failures either at the top level of `details` or, for mutation
 * errors, per action under `details.items[].error`. Flatten both so callers can look for an
 * error type in one place.
 */
function getActionErrorEntries(error: unknown): ActionErrorEntry[] {
  if (!isErrorWithDetails(error)) return []

  const details = error.details as ActionErrorDetails
  const itemErrors = Array.isArray(details.items)
    ? details.items
        .map((item) => item?.error)
        .filter((item): item is ActionErrorEntry => typeof item === 'object' && item !== null)
    : []

  return [details, ...itemErrors]
}

/** @internal */
export function isInsufficientPermissionsError(error: unknown): boolean {
  return getActionErrorEntries(error).some((entry) => entry.type === 'insufficientPermissionsError')
}

/**
 * When `sanity.action.variant.definition.delete` is refused because documents still reference
 * the definition (`documentHasExistingReferencesError`), returns how many documents do.
 *
 * The server lists every referencing version document — one per bundle, possibly repeated —
 * while the Studio counts one row per document group (see `useVariantsDocumentCounts`), so the
 * ids are deduped by published id. Returns `undefined` for any other error, or when the server
 * did not include the referencing ids.
 *
 * @internal
 */
export function getReferencingDocumentCount(error: unknown): number | undefined {
  const entry = getActionErrorEntries(error).find(
    (candidate) => candidate.type === 'documentHasExistingReferencesError',
  )
  if (!entry || !Array.isArray(entry.referencingIDs)) return undefined

  const groupIds = new Set(
    entry.referencingIDs
      .filter((id): id is string => typeof id === 'string')
      .map((id) => getPublishedId(id)),
  )

  return groupIds.size > 0 ? groupIds.size : undefined
}
