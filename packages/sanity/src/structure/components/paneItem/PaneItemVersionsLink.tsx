import {type MouseEvent, type ReactNode, useCallback, useContext} from 'react'
import {PaneRouterContext} from 'sanity/_singletons'
import {useRouter} from 'sanity/router'

import {DOCUMENT_GROUP_INSPECTOR_NAME} from '../../panes/document/constants'
import {versionsLink} from './PaneItemVersionsLink.css'

/**
 * Wraps the status icons of a document list row so a click on them opens the document with the
 * document group inventory already open, while a click anywhere else on the row opens the
 * document as before.
 *
 * The row itself is a link, so this is not a link of its own: it stops the row's navigation and
 * navigates to the same pane state the row link would, with the inventory's inspector named in
 * the pane's `inspect` parameter.
 *
 * @internal
 */
export function PaneItemVersionsLink(props: {children: ReactNode; childId: string}) {
  const {children, childId} = props
  const {navigate} = useRouter()
  const {routerPanesState, groupIndex} = useContext(PaneRouterContext)

  const handleClick = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      // Keep the browser's own behaviour for modified clicks on the row link (new tab, window).
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      navigate({
        panes: [
          ...routerPanesState.slice(0, groupIndex + 1),
          [{id: childId, params: {inspect: DOCUMENT_GROUP_INSPECTOR_NAME}}],
        ],
      })
    },
    [childId, groupIndex, navigate, routerPanesState],
  )

  return (
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events -- a pointer shortcut inside the row link; the row stays the keyboard target, and the inventory stays reachable from the document's Manage versions button
    <span className={versionsLink} data-testid="pane-item-versions-link" onClick={handleClick}>
      {children}
    </span>
  )
}
