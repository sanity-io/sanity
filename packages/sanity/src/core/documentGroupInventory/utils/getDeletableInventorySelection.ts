import {type ReleaseDocument} from '@sanity/client'

import {
  partitionBulkActionSelection,
  resolveDocumentActionIds,
} from '../../config/document/bulkDocumentActions'
import {type Source} from '../../config/types'
import {type Variant} from '../machines/selectionMachine'
import {getInventoryRowActionsContext} from './getInventoryRowActionsContext'

/**
 * @internal
 */
export function getDeletableInventorySelection(options: {
  selectedIds: ReadonlySet<string>
  variants: readonly Variant[]
  releases: ReadonlyMap<string, ReleaseDocument>
  schemaType: string | undefined
  resolveActions: Source['document']['actions']
}): {
  deletableIds: string[]
  /** Rows `document.actions` withheld the delete action from. */
  excludedCount: number
  /** Rows left out only because their action identity has not resolved yet. */
  pendingCount: number
  shouldShowDelete: boolean
} {
  const {selectedIds, variants, releases, schemaType, resolveActions} = options
  const selected = variants.filter((variant) => selectedIds.has(variant.id))

  const {included, excluded, pending, shouldShowControl} = partitionBulkActionSelection({
    items: selected,
    actionId: 'delete',
    getActionIds: (variant) => {
      if (!schemaType) {
        return null
      }

      const releaseRef = variant.document._system.release?._ref
      const release = releaseRef ? releases.get(releaseRef) : undefined

      // Until the release loads, a cardinality-one row is indistinguishable from
      // a plain version, so its action identity is not ready.
      if (releaseRef && release === undefined) {
        return null
      }

      const context = getInventoryRowActionsContext({
        document: variant.document,
        release,
        schemaType,
      })

      return resolveDocumentActionIds(resolveActions(context))
    },
  })

  return {
    deletableIds: included.map((variant) => variant.id),
    excludedCount: excluded.length,
    pendingCount: pending.length,
    shouldShowDelete: shouldShowControl,
  }
}
