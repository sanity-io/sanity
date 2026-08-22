import {type DocumentActionComponent} from './actions'

/**
 * Bulk-selection rule for `document.actions`. Both halves are required:
 *
 * 1. Hide a bulk control only when `actionId` is absent for every selected row
 *    (or the selection is empty).
 * 2. Exclude any row whose resolved id set does not contain `actionId` from the
 *    operation — the transaction, dialog list, and counts.
 *
 * A mixed selection therefore shows the control and operates only on `included`.
 * `getActionIds` must return `null` when the row's action identity (schemaType +
 * versionType) is not ready — those rows are treated as the id being absent.
 *
 * Resolve ids with `source.document.actions(ctx)` and `.has(id)`. Do not render
 * resolved action descriptions outside the document pane.
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
): Set<string> {
  return new Set(components.flatMap(({action}) => (action ? [action] : [])))
}

/**
 * @internal
 */
export function partitionBulkActionSelection<T>(options: {
  items: readonly T[]
  actionId: string
  getActionIds: (item: T) => ReadonlySet<string> | null
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
 * Second half of the bulk rule: the transaction, dialog list, and counts may
 * only include ids that survived {@link partitionBulkActionSelection}.
 *
 * @internal
 */
export function restrictIdsToConfiguredAction(
  requestedIds: readonly string[],
  allowedIds: ReadonlySet<string>,
): string[] {
  return requestedIds.filter((id) => allowedIds.has(id))
}
