import {useCallback} from 'react'
import {useRouter} from 'sanity/router'
import {type UseDocumentListItemOverride} from 'sanity/structure'

import {useVersionList} from '../data/useVersionList'
import {STOCK_OPTION, useOption} from '../options/store'
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

/** Keeps the 25px slot while the versions load, so rows do not jump. */
const SLOT = <span style={{display: 'block', width: 25, height: 25}} />

export const useRowOverride: UseDocumentListItemOverride = ({documentId, documentType, defaultStatus}) => {
  const option = useOption('c3')
  const stock = option === STOCK_OPTION
  const versions = useVersionList(documentId, !stock)
  const router = useRouter()

  // v1: a click opens the base document (the inventory pane arrives with C4). v2 rows: the picked version.
  const openDocument = useCallback(
    (id: string) => router.navigateIntent('edit', {id, type: documentType}),
    [router, documentType],
  )
  const openVersion = useCallback((pick: VersionPick) => openDocument(pick.docId), [openDocument])

  if (stock) return undefined
  if (versions === null) return {status: SLOT, tooltip: null}
  if (versions.length === 0 || (!SHOW_ON_EVERY_ROW && !hasMoreThanBase(versions))) {
    return {status: defaultStatus, tooltip: null}
  }

  const dot = baseDot(versions)

  if (option === 'b') {
    // v2: the flyout. Clickable rows, and the popover stays open while the pointer travels to it.
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
      <VersionMark docId={documentId} dot={dot} onOpenPane={openDocument} trigger="badge" versions={versions} />
    ),
    tooltip: null,
  }
}

