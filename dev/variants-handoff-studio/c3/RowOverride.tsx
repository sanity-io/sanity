import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {type UseDocumentListItemOverride} from 'sanity/structure'

import {usePerspectiveMatch} from '../data/match'
import {useVersionList} from '../data/useVersionList'
import {STOCK_OPTION, useOption} from '../options/store'
import {type TileMark} from './StateBadge'
import {baseDot, earliestRelease} from './types'
import {VersionMark} from './VersionMark'

/**
 * C3 in the real document list, option A (the open beta): a versions control on every row. Hover or focus opens a read-only popover; a click opens
 * the document with its inventory. Mounted through the PROPOSED `DocumentListItemOverrideProvider`
 * (packages/sanity/src/structure/components/paneItem/DocumentListItemOverride.tsx).
 */

/** Name of the inspector registered in c4/InventoryInspector.tsx. */
const INVENTORY_INSPECTOR = 'variants-inventory'

/** Keeps the tile's 43 × 29 slot while the versions load, so rows do not jump (Figma C3 D, "Loading (slot kept)"). */
const SLOT = (
  <span data-testid="version-tile-slot" style={{display: 'block', width: 43, height: 29}} />
)

export const useRowOverride: UseDocumentListItemOverride = ({
  documentId,
  documentType,
  defaultStatus,
}) => {
  const stock = useOption('c3') === STOCK_OPTION
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

  // Option D (Figma C3 "D contained tile", 22 Oct). With no audience chosen: the base document's dot (the draft over the published one, none when
  // the document exists only in a release) and a diamond when the document has any variant. With an audience chosen: the diamond only, and
  // only when a variant matches it; otherwise the tile is empty.
  const variantIds = versions.flatMap((v) => (v.variantId ? [v.variantId] : []))
  // A document that exists only in releases is marked with its earliest release's dot (Faheem, 22 Oct), not left empty.
  const base = baseDot(versions) ?? earliestRelease(versions)
  const marks: TileMark[] = !perspective.active
    ? [...(base ? [base] : []), ...(variantIds.length ? (['variant'] as const) : [])]
    : perspective.best(variantIds)
      ? ['variant']
      : []

  return {
    status: (
      <VersionMark
        docId={documentId}
        marks={marks}
        onOpenPane={openWithInventory}
        trigger="tile"
        versions={versions}
      />
    ),
    tooltip: null,
  }
}
