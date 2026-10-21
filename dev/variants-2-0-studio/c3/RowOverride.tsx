import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {type UseDocumentListItemOverride} from 'sanity/structure'

import {usePerspectiveState} from '../c1/state'
import {useVariantDefinitions} from '../c1/world'
import {usePerspectiveMatch} from '../data/match'
import {useVersionList} from '../data/useVersionList'
import {RowExtras} from '../list/ListParts'
import {exactVariantId} from '../list/listStore'
import {STOCK_OPTION, useOption} from '../options/store'
import {PageVersionLabel, pageVersion, usePresentationAudience} from '../presentation/pageVersion'
import {baseDot, hasMoreThanBase} from './types'
import {VersionMark, type VersionPick} from './VersionMark'

/**
 * C3 in the real document list. Mounted through the PROPOSED `DocumentListItemOverrideProvider`
 * (packages/sanity/src/structure/components/paneItem/DocumentListItemOverride.tsx).
 *
 * Handoff rule (19 Oct): the control shows on EVERY row, also with only the base version. Flip this to show it only
 * when a document has more than draft and published (variants or releases attached).
 */
const SHOW_ON_EVERY_ROW = true

/** Name of the inspector registered in c4/InventoryInspector.tsx. */
const INVENTORY_INSPECTOR = 'variants-inventory'

/** Keeps the 25px slot while the versions load, so rows do not jump. */
const SLOT = <span style={{display: 'block', width: 25, height: 25}} />

const useBaseRowOverride: UseDocumentListItemOverride = ({
  documentId,
  documentType,
  defaultStatus,
}) => {
  const option = useOption('c3')
  const stock = option === STOCK_OPTION
  const versions = useVersionList(documentId, !stock)
  const router = useRouter()
  const audience = usePresentationAudience('presentation')
  const perspective = usePerspectiveMatch()

  // v2/C rows: a click on a picked version opens that document.
  const openDocument = useCallback(
    (id: string) => router.navigateIntent('edit', {id, type: documentType}),
    [router, documentType],
  )
  // v1 (A): a click on the control opens the base document AND the Versions inspector (C4), side by side.
  // The `edit` intent forwards extra params to the pane, so `inspect` opens the inspector on arrival.
  const openWithInventory = useCallback(
    (id: string) =>
      router.navigateIntent('edit', {id, type: documentType, inspect: INVENTORY_INSPECTOR}),
    [router, documentType],
  )
  const openVersion = useCallback((pick: VersionPick) => openDocument(pick.docId), [openDocument])

  if (stock) return undefined
  if (versions === null) return {status: SLOT, tooltip: null}
  // In Presentation with an audience chosen, the row says which version that audience gets (P2).
  if (audience) {
    return {
      status: (
        <PageVersionLabel
          version={pageVersion(versions, audience.variantId, audience.title, audience.perspective)}
        />
      ),
      tooltip: null,
    }
  }
  if (versions.length === 0 || (!SHOW_ON_EVERY_ROW && !hasMoreThanBase(versions))) {
    return {status: defaultStatus, tooltip: null}
  }

  // One indicator, reactive to the perspective (call of 20 Oct). With no perspective it is the base document's state: one icon, the draft over the
  // published one, and none when the document exists only in a release. With a perspective the state dot goes and a diamond marks only the
  // documents that have a variant matching it. Option D says it with sections instead, so its rows carry no diamond.
  const dot: 'published' | 'draft' | 'variant' | null = !perspective.active
    ? baseDot(versions)
    : option !== 'd' &&
        option !== 'e' &&
        perspective.best(versions.flatMap((v) => (v.variantId ? [v.variantId] : [])))
      ? 'variant'
      : null

  if (option === 'b' || option === 'e') {
    // v2: the flyout (E: the same flyout on the grouped list). Clickable rows, and the popover stays open while the pointer travels to it.
    return {
      status: (
        <VersionMark
          docId={documentId}
          dot={dot}
          hoverIntent="triangle"
          onOpenPane={openDocument}
          onOpenVersion={openVersion}
          pattern="pl1"
          rowsClickable
          trigger="badge"
          versions={versions}
        />
      ),
      tooltip: null,
    }
  }

  if (option === 'c') {
    // Exploration: no icon; the state dot is the control and its popover has clickable pills.
    return {
      status: (
        <VersionMark
          docId={documentId}
          dot={dot}
          onOpenPane={openDocument}
          onOpenVersion={openVersion}
          option="b"
          trigger="dot"
          versions={versions}
        />
      ),
      tooltip: null,
    }
  }

  // v1 (A): the 25px versions control with the base-state badge; hover or focus opens a read-only popover.
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

/**
 * The shipped row override, plus the E9 list parts: a hidden marker on the rows that have a matching variant (listMark C styles them), the
 * Differs word and Looked at tag (reviewPass) and the chevron flyout (listFlyout). The marker and the extras are added around whatever
 * status the C3 option draws.
 */
export const useRowOverride: UseDocumentListItemOverride = (args) => {
  const base = useBaseRowOverride(args)
  const versions = useVersionList(args.documentId, true)
  const perspective = usePerspectiveMatch()
  const {chosen} = usePerspectiveState()
  const definitions = useVariantDefinitions()
  if (!base) return base
  const variantId = exactVariantId(chosen, definitions)
  const has =
    perspective.active &&
    !!versions &&
    perspective.best(versions.flatMap((v) => (v.variantId ? [v.variantId] : []))) !== null
  return {
    ...base,
    status: (
      <>
        {has ? <span data-e9-has="" style={{display: 'none'}} /> : null}
        <RowExtras
          documentId={args.documentId}
          documentType={args.documentType}
          variantId={variantId}
          versions={versions ?? []}
        />
        {base.status}
      </>
    ),
  }
}
