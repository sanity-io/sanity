import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {type UseDocumentListItemOverride} from 'sanity/structure'

import {usePerspectiveMatch} from '../data/match'
import {useVersionList} from '../data/useVersionList'
import {STOCK_OPTION, useOption} from '../options/store'
import {BaseDotOnly, type TileMark} from './StateBadge'
import {baseDot, earliestRelease} from './types'
import {VersionMark} from './VersionMark'

/**
 * C3 in the real document list, option A (the open beta): a versions control on every row. Hover or focus opens a read-only popover; a click opens
 * the document with its inventory. Mounted through the PROPOSED `DocumentListItemOverrideProvider`
 * (packages/sanity/src/structure/components/paneItem/DocumentListItemOverride.tsx).
 */

/** Name of the inspector registered in c4/InventoryInspector.tsx. */
const INVENTORY_INSPECTOR = 'variants-inventory'

/** Keeps the control's 43 × 29 slot while the versions load, so rows do not jump (Figma C3 B, "Loading (slot kept)"). */
const SLOT = (
  <span data-testid="version-tile-slot" style={{display: 'block', width: 43, height: 29}} />
)

/** Nothing to show, in the icon column's width, so the row keeps its layout. */
function EmptySlot() {
  return <span aria-hidden style={{display: 'block', width: 29, height: 29}} />
}

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

  // T3 option A (v1): the versions icon on every row with the state dot as a badge. One indicator, reactive to the perspective (call of 20
  // Oct): with no perspective, the base document's state (the draft over the published one, none for a document only in a release); with a
  // perspective, a diamond only on documents with a matching variant.
  if (option === 'a') {
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

  // T3 option B (Figma C3 674:3362, 22 Oct): the tile only where there is more than a base version (a variant, or a version in a release).
  const hasMore =
    variantIds.length > 0 ||
    versions.some((v) => v.bundleId !== 'published' && v.bundleId !== 'drafts')
  const base = baseDot(versions)
  if (!hasMore) {
    // Base only: the state dot alone, no tile and no button. With an audience chosen there is nothing to mark.
    return {
      status: !perspective.active && base ? <BaseDotOnly state={base} /> : <EmptySlot />,
      tooltip: null,
    }
  }
  // With no audience: the base dot, or the earliest release's dot for a document only in releases, then a diamond when there is any
  // variant. With an audience: the diamond only, and only when a variant matches; otherwise the tile holds just the icon.
  const first = base ?? earliestRelease(versions)
  const marks: TileMark[] = !perspective.active
    ? [...(first ? [first] : []), ...(variantIds.length ? (['variant'] as const) : [])]
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
