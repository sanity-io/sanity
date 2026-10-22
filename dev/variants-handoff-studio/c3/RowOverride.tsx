import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {type UseDocumentListItemOverride} from 'sanity/structure'

import {usePerspectiveMatch} from '../data/match'
import {useVersionList} from '../data/useVersionList'
import {STOCK_OPTION, useOption} from '../options/store'
import {baseDot} from './types'
import {VersionMark} from './VersionMark'

/**
 * C3 in the real document list, option A (the open beta): a versions control on every row. Hover or focus opens a read-only popover; a click opens
 * the document with its inventory. Mounted through the PROPOSED `DocumentListItemOverrideProvider`
 * (packages/sanity/src/structure/components/paneItem/DocumentListItemOverride.tsx).
 */

/** Name of the inspector registered in c4/InventoryInspector.tsx. */
const INVENTORY_INSPECTOR = 'variants-inventory'

/** Keeps the control's slot while the versions load, so rows do not jump. */
const SLOT = (
  <span data-testid="version-mark-slot" style={{display: 'block', width: 43, height: 29}} />
)

export const useRowOverride: UseDocumentListItemOverride = ({
  documentId,
  documentType,
  defaultStatus,
}) => {
  const option = useOption('c3')
  const stock = option === STOCK_OPTION
  const versions = useVersionList(documentId, !stock)
  const router = useRouter()
  const perspective = usePerspectiveMatch()

  // A click on the control opens the base document AND the Versions inspector, side by side.
  // The `edit` intent forwards extra params to the pane, so `inspect` opens the inspector on arrival.
  const openWithInventory = useCallback(
    (id: string) =>
      router.navigateIntent('edit', {id, type: documentType, inspect: INVENTORY_INSPECTOR}),
    [router, documentType],
  )

  if (stock) return undefined
  if (versions === null) return {status: SLOT, tooltip: null}
  if (versions.length === 0) return {status: defaultStatus, tooltip: null}

  const variantIds = versions.flatMap((v) => (v.variantId ? [v.variantId] : []))

  // T3 option A (v1), locked for the open beta (SAPP-4723, Faheem 22 Oct): the versions icon on every row with the state dot as a badge. One
  // indicator, reactive to the perspective (call of 20 Oct): with no perspective, the base document's state (the draft over the published one,
  // none for a document only in a release); with a perspective, a diamond only on documents with a matching variant.
  const dot: 'published' | 'draft' | 'variant' | null = !perspective.active
    ? baseDot(versions)
    : perspective.best(variantIds)
      ? 'variant'
      : null
  return {
    status: (
      <VersionMark
        docId={documentId}
        dot={dot}
        onOpenPane={openWithInventory}
        trigger="badge"
        versions={versions}
      />
    ),
    tooltip: null,
  }
}
