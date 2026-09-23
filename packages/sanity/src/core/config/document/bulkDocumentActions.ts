import {type DocumentActionComponent, type DocumentActionKeys} from './actions'

/**
 * The bulk-selection rule for `document.actions` is documented under "Bulk selections" in
 * `docs/CORE_CONCEPTS.md`.
 *
 * @internal
 */
export interface BulkDocumentActionSelection<T> {
  included: T[]
  excluded: T[]
  shouldShowControl: boolean
}

/**
 * @internal
 */
export function resolveDocumentActionIds(
  components: readonly DocumentActionComponent[],
): Set<keyof DocumentActionKeys> {
  return new Set(components.flatMap(({action}) => (action ? [action] : [])))
}

/**
 * @internal
 */
export function partitionBulkActionSelection<T>(options: {
  items: readonly T[]
  actionId: keyof DocumentActionKeys
  getActionIds: (item: T) => ReadonlySet<keyof DocumentActionKeys> | null
}): BulkDocumentActionSelection<T> {
  const {items, actionId, getActionIds} = options
  const decisions = items.map((item) => ({
    item,
    allowed: getActionIds(item)?.has(actionId) === true,
  }))
  const included = decisions.filter((decision) => decision.allowed).map((decision) => decision.item)
  const excluded = decisions
    .filter((decision) => !decision.allowed)
    .map((decision) => decision.item)

  return {
    included,
    excluded,
    shouldShowControl: included.length > 0,
  }
}

/**
 * @internal
 */
export function restrictIdsToConfiguredAction(
  requestedIds: readonly string[],
  allowedIds: ReadonlySet<string>,
): string[] {
  return requestedIds.filter((id) => allowedIds.has(id))
}
