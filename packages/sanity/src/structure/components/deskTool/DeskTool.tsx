import {PortalProvider, useTheme, useToast} from '@sanity/ui'
import React, {memo, Fragment, useState, useEffect, useCallback} from 'react'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {LOADING_PANE} from '../../constants'
import {LoadingPane, DeskToolPane} from '../../panes'
import {useResolvedPanes} from '../../structureResolvers'
import {PaneNode} from '../../types'
import {PaneLayout} from '../pane'
import {useDeskTool} from '../../useDeskTool'
import {NoDocumentTypesScreen} from './NoDocumentTypesScreen'
import {DeskTitle} from './DeskTitle'
import {useSchema, _isCustomDocumentTypeDefinition} from 'sanity'
import {useRouterState} from 'sanity/router'

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
  const {push: pushToast} = useToast()
  const schema = useSchema()
  const {layoutCollapsed, setLayoutCollapsed} = useDeskTool()
  const {paneDataItems, resolvedPanes} = useResolvedPanes()
  // Intent resolving is processed by the sibling `<IntentResolver />` but it doesn't have a UI for indicating progress.
  // We handle that here, so if there are only 1 pane (the root structure), and there's an intent state in the router, we need to show a placeholder LoadingPane until
  // the structure is resolved and we know what panes to load/display
  const isResolvingIntent = useRouterState(
    useCallback((routerState) => typeof routerState.intent === 'string', []),
  )
  const {
    sanity: {media},
  } = useTheme()

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
        minWidth={media[1]}
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
                  path={path}
                  selected={selected}
                  siblingIndex={siblingIndex}
                />
              )}
            </Fragment>
          ),
        )}
        {/* If there's just 1 pane (the root), or less, and we're resolving an intent then it's necessary to show */}
        {/* a loading indicator as the intent resolving is async, could take a while and can also be interrupted/redirected */}
        {paneDataItems.length <= 1 && isResolvingIntent && (
          <LoadingPane paneKey="intent-resolver" />
        )}
      </StyledPaneLayout>
      <DeskTitle resolvedPanes={resolvedPanes} />
      <div data-portal="" ref={setPortalElement} />
    </PortalProvider>
  )
})
