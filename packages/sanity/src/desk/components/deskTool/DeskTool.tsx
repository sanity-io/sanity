import {PortalProvider, useToast} from '@sanity/ui'
import React, {memo, Fragment, useState, useEffect, useCallback} from 'react'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {useSchema} from '../../../hooks'
import {useRouter} from '../../../router'
import {LOADING_PANE} from '../../constants'
import {LoadingPane, DeskToolPane} from '../../panes'
import {getWaitMessages} from '../../panes/loading/getWaitMessages'
import {useResolvedPanes} from '../../structureResolvers'
import {PaneNode} from '../../types'
import {PaneLayout} from '../pane'
import {useDeskTool} from '../../useDeskTool'
import {_isCustomDocumentTypeDefinition} from '../../../util'
import {NoDocumentTypesScreen} from './NoDocumentTypesScreen'

interface DeskToolProps {
  onPaneChange: (panes: Array<PaneNode | typeof LOADING_PANE>) => void
}

const StyledPaneLayout = styled(PaneLayout)`
  min-height: 100%;
  min-width: 320px;
`

const isSaveHotkey = isHotkey('mod+s')

/**
 * @internal
 */
export const DeskTool = memo(function DeskTool({onPaneChange}: DeskToolProps) {
  const {navigate} = useRouter()
  const {push: pushToast} = useToast()
  const schema = useSchema()
  const {layoutCollapsed, setLayoutCollapsed} = useDeskTool()
  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes()

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [setLayoutCollapsed])
  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [setLayoutCollapsed])

  useEffect(() => {
    // we check for length before emitting here to skip the initial empty array
    // state from the `useResolvedPanes` hook. there should always be a root
    // pane emitted on subsequent emissions
    if (resolvedPanes.length) {
      onPaneChange(resolvedPanes)
    }
  }, [onPaneChange, resolvedPanes])

  // The pane layout is "collapsed" on small screens, and only shows 1 pane at a time.
  // Remove pane siblings (i.e. split panes) as the pane layout collapses.
  useEffect(() => {
    if (!layoutCollapsed) return
    const hasSiblings = routerPanes.some((group) => group.length > 1)

    if (!hasSiblings) return
    const withoutSiblings = routerPanes.map((group) => [group[0]])

    navigate({panes: withoutSiblings}, {replace: true})
  }, [navigate, layoutCollapsed, routerPanes])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Prevent `Cmd+S`
      if (isSaveHotkey(event)) {
        event.preventDefault()

        pushToast({
          closable: true,
          id: 'auto-save-message',
          status: 'info',
          title: 'Your work is automatically saved!',
          duration: 4000,
        })
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [pushToast])

  const hasDefinedDocumentTypes = schema._original?.types.some(_isCustomDocumentTypeDefinition)

  if (!hasDefinedDocumentTypes) {
    return <NoDocumentTypesScreen />
  }

  return (
    <PortalProvider element={portalElement || null}>
      <StyledPaneLayout
        flex={1}
        height={layoutCollapsed ? undefined : 'fill'}
        minWidth={512}
        onCollapse={handleRootCollapse}
        onExpand={handleRootExpand}
      >
        {paneDataItems.map(
          ({
            active,
            childItemId,
            groupIndex,
            itemId,
            key: paneKey,
            pane,
            index: paneIndex,
            params: paneParams,
            path,
            payload,
            siblingIndex,
            selected,
          }) => (
            <Fragment key={`${pane === LOADING_PANE ? 'loading' : pane.type}-${paneIndex}`}>
              {pane === LOADING_PANE ? (
                <LoadingPane paneKey={paneKey} path={path} selected={selected} />
              ) : (
                <DeskToolPane
                  active={active}
                  groupIndex={groupIndex}
                  index={paneIndex}
                  pane={pane}
                  childItemId={childItemId}
                  itemId={itemId}
                  paneKey={paneKey}
                  params={paneParams}
                  payload={payload}
                  selected={selected}
                  siblingIndex={siblingIndex}
                />
              )}
            </Fragment>
          )
        )}
      </StyledPaneLayout>
      <div data-portal="" ref={setPortalElement} />
    </PortalProvider>
  )
})
