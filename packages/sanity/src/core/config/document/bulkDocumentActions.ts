import {type DocumentActionComponent, type DocumentActionKeys} from './actions'

/**
 * The bulk-selection rule for `document.actions` is documented under "Bulk selections" in
 * `docs/CORE_CONCEPTS.md`.
 *
 * @internal
 */
export interface BulkDocumentActionSelection<T> {
  included: T[]
  /** Items the configuration withheld the action from. */
  excluded: T[]
  /** Items whose action identity has not resolved yet. Left out like `excluded`, for a different reason. */
  pending: T[]
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
  const decisions = items.map((item) => ({item, actionIds: getActionIds(item)}))

  const included = decisions
    .filter(({actionIds}) => actionIds?.has(actionId) === true)
    .map(({item}) => item)
  const excluded = decisions
    .filter(({actionIds}) => actionIds?.has(actionId) === false)
    .map(({item}) => item)
  const pending = decisions.filter(({actionIds}) => actionIds === null).map(({item}) => item)

  return {
    included,
    excluded,
    pending,
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
