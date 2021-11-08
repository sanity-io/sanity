import {getTemplateById} from '@sanity/base/initial-value-templates'
import {useRouter, useRouterState} from '@sanity/base/router'
import {PortalProvider, useToast} from '@sanity/ui'
import React, {memo, Fragment, useState, useEffect, useCallback} from 'react'
import styled from 'styled-components'
import {PaneNode} from './types'
import {PaneLayout} from './components/pane'
import {LOADING_PANE} from './constants'
import {DeskToolProvider} from './contexts/deskTool'
import {useResolvedPanes} from './utils/useResolvedPanes'
import {getIntentRouteParams, getWaitMessages, isSaveHotkey} from './helpers'
import {DeskToolPane, LoadingPane} from './panes'

interface DeskToolProps {
  onPaneChange: (panes: Array<PaneNode | typeof LOADING_PANE>) => void
}

const StyledPaneLayout = styled(PaneLayout)`
  min-height: 100%;
  min-width: 320px;
`

/**
 * @internal
 */
export const DeskTool = memo(({onPaneChange}: DeskToolProps) => {
  const {push: pushToast} = useToast()
  const {navigate, getState} = useRouter()
  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes()

  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [])
  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [])

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
    const hasSiblings = routerPanes?.some((group) => group.length > 1)

    if (!hasSiblings) return
    const withoutSiblings = routerPanes?.map((group) => [group[0]])

    navigate({panes: withoutSiblings}, {replace: true})
  }, [navigate, layoutCollapsed, routerPanes])

  // Handle old-style URLs
  const shouldRewrite = useRouterState(
    useCallback((routerState) => {
      const {action, legacyEditDocumentId, type: schemaType, editDocumentId, params = {}} =
        routerState || {}

      const {template: templateName} = params
      const template = getTemplateById(templateName)
      const type = (template && template.schemaType) || schemaType
      return (action === 'edit' && legacyEditDocumentId) || (type && editDocumentId)
    }, [])
  )

  useEffect(() => {
    if (!shouldRewrite) return

    const {legacyEditDocumentId, type: schemaType, editDocumentId, params = {}} = getState() || {}
    const {template: templateName, ...payloadParams} = params
    const template = getTemplateById(templateName)
    const type = (template && template.schemaType) || schemaType

    navigate(
      getIntentRouteParams({
        id: editDocumentId || legacyEditDocumentId,
        type,
        payloadParams,
        templateName,
      }),
      {replace: true}
    )
  }, [getState, navigate, shouldRewrite])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Prevent `Cmd+S`
      if (isSaveHotkey(event)) {
        event.preventDefault()

        pushToast({
          closable: true,
          id: 'auto-save-message',
          status: 'info',
          title: 'Sanity auto-saves your work!',
          duration: 4000,
        })
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [pushToast])

  return (
    <DeskToolProvider layoutCollapsed={layoutCollapsed}>
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
                  <LoadingPane
                    path={path}
                    index={paneIndex}
                    message={getWaitMessages}
                    selected={selected}
                  />
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
    </DeskToolProvider>
  )
})

DeskTool.displayName = 'DeskTool'
