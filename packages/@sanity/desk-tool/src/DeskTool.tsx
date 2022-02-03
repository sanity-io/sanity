import {useSource} from '@sanity/base'
import {getTemplateById} from '@sanity/base/initial-value-templates'
import {RouterState, useRouter} from '@sanity/base/router'
import {DocumentNodeResolver, StructureBuilder} from '@sanity/base/structure'
import {SchemaType} from '@sanity/types'
import {PortalProvider, useToast} from '@sanity/ui'
import React, {memo, Fragment, useState, useEffect, useCallback, useMemo} from 'react'
import {Subject} from 'rxjs'
import {map} from 'rxjs/operators'
import styled from 'styled-components'
import {PaneLayout} from './components/pane'
import {LOADING_PANE} from './constants'
import {DeskToolProvider} from './contexts/deskTool'
import {getIntentRouteParams, getWaitMessages, isSaveHotkey} from './helpers'
import {DeskToolPane, LoadingPane} from './panes'
import {useResolvedPanes} from './structure/useResolvedPanes'
import {DocumentActionsResolver, PaneNode, RouterPanes, UnresolvedPaneNode} from './types'

interface DeskToolProps {
  components: {
    LanguageFilter?: React.ComponentType<{schemaType: SchemaType}>
  }
  onPaneChange: (panes: Array<PaneNode | typeof LOADING_PANE>) => void
  resolveDocumentActions: DocumentActionsResolver
  resolveDocumentNode: DocumentNodeResolver
  structure: UnresolvedPaneNode
  structureBuilder: StructureBuilder
}

const StyledPaneLayout = styled(PaneLayout)`
  min-height: 100%;
  min-width: 320px;
`

const EMPTY_ROUTER_STATE: RouterState = {}

/**
 * @internal
 */
export const DeskTool = memo(function DeskTool(props: DeskToolProps) {
  const {
    components,
    onPaneChange,
    resolveDocumentActions,
    resolveDocumentNode,
    structure,
    structureBuilder,
  } = props
  const source = useSource()
  const {push: pushToast} = useToast()
  const {navigate, state: routerState = EMPTY_ROUTER_STATE} = useRouter()

  const routerStateSubject = useMemo(() => new Subject<RouterState>(), [])
  const routerState$ = useMemo(() => routerStateSubject.asObservable(), [routerStateSubject])
  const routerPanes$ = useMemo(
    () => routerState$.pipe(map((_routerState) => (_routerState?.panes || []) as RouterPanes)),
    [routerState$]
  )

  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes(
    structureBuilder,
    structure,
    resolveDocumentNode,
    routerPanes$
  )

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
  const shouldRewrite = useMemo(() => {
    const {
      action,
      legacyEditDocumentId,
      type: schemaType,
      editDocumentId,
      params = {},
    } = routerState as any

    const {template: templateName} = params
    const template = getTemplateById(source.schema, source.initialValueTemplates, templateName)
    const type = (template && template.schemaType) || schemaType
    return (action === 'edit' && legacyEditDocumentId) || (type && editDocumentId)
  }, [source.initialValueTemplates, routerState, source.schema])

  useEffect(() => {
    if (!shouldRewrite) return

    const {legacyEditDocumentId, type: schemaType, editDocumentId, params = {}} = routerState as any
    const {template: templateName, ...payloadParams} = params
    const template = getTemplateById(source.schema, source.initialValueTemplates, templateName)
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
  }, [source.initialValueTemplates, navigate, routerState, source.schema, shouldRewrite])

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

  useEffect(() => routerStateSubject.next(routerState), [routerStateSubject, routerState])

  return (
    <DeskToolProvider
      components={components}
      layoutCollapsed={layoutCollapsed}
      resolveDocumentActions={resolveDocumentActions}
      structure={structure}
    >
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
                    paneKey={paneKey}
                    path={path}
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
