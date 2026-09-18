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
}): {deletableIds: string[]; shouldShowDelete: boolean} {
  const {selectedIds, variants, releases, schemaType, resolveActions} = options
  const selected = variants.filter((variant) => selectedIds.has(variant.id))

  const {included, shouldShowControl} = partitionBulkActionSelection({
    items: selected,
    actionId: 'delete',
    getActionIds: (variant) => {
      if (!schemaType) {
        return null
      }

      const releaseRef = variant.document._system.release?._ref
      const release = releaseRef ? releases.get(releaseRef) : undefined
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
    shouldShowDelete: shouldShowControl,
  }
}
