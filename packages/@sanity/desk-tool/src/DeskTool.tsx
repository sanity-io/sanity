import {getTemplateById} from '@sanity/base/initial-value-templates'
import {useRouter, useRouterState} from '@sanity/base/router'
import {PortalProvider, useToast} from '@sanity/ui'
import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {Observable, interval, of} from 'rxjs'
import {map, switchMap, distinctUntilChanged, debounce} from 'rxjs/operators'
import styled from 'styled-components'
import {PaneNode, RouterPanes, StructureErrorType, UnresolvedPaneNode} from './types'
import {PaneLayout} from './components/pane'
import {StructureError} from './components/StructureError'
import {LOADING_PANE} from './constants'
import {DeskToolProvider} from './contexts/deskTool'
import {getPanes} from './getPanes'
import {
  getIntentRouteParams,
  getPaneDiffIndex,
  getWaitMessages,
  hasLoading,
  isSaveHotkey,
} from './helpers'
import {DeskToolPane, LoadingPane} from './panes'
import {
  resolvePanes,
  loadStructure,
  maybeSerialize,
  setStructureResolveError,
} from './utils/resolvePanes'

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
export function DeskTool(props: DeskToolProps) {
  const {onPaneChange} = props
  const {push: pushToast} = useToast()
  const {navigate} = useRouter()
  const routerState = useRouterState()
  const routerPanes: RouterPanes = useMemo(() => routerState?.panes || [], [routerState?.panes])
  const [error, setError] = useState<StructureErrorType | null>(null)
  const prevRouterPanesRef = useRef<RouterPanes | null>(null)
  const currRouterPanesRef = useRef<RouterPanes>(routerPanes)
  const [layoutCollapsed, setLayoutCollapsed] = useState(false)
  const [resolvedPanes, setResolvedPanes] = useState<Array<PaneNode | typeof LOADING_PANE>>([])
  const resolvedPanesRef = useRef(resolvedPanes)
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)
  const structure$Ref = useRef<Observable<UnresolvedPaneNode> | null>(null)

  const {action, legacyEditDocumentId, type: schemaType, editDocumentId, params = {}} =
    routerState || {}

  const panes = useMemo(() => getPanes(resolvedPanes, routerPanes), [resolvedPanes, routerPanes])

  const setResolveError = useCallback((_error: StructureErrorType) => {
    setStructureResolveError(_error)

    // Log error for proper stack traces
    console.error(_error) // eslint-disable-line no-console

    setError(_error)
  }, [])

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [])

  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [])

  // Load the structure configuration observable
  useEffect(() => {
    structure$Ref.current = loadStructure().pipe(distinctUntilChanged(), map(maybeSerialize))

    return () => {
      structure$Ref.current = null
    }
  }, [])

  // The pane layout is "collapsed" on small screens, and only shows 1 pane at a time.
  // Remove pane siblings (i.e. split panes) as the pane layout collapses.
  useEffect(() => {
    if (!layoutCollapsed) {
      return
    }

    const hasSiblings = routerPanes.some((group) => group.length > 1)

    if (!hasSiblings) {
      return
    }

    const withoutSiblings = routerPanes.map((group) => [group[0]])

    navigate({panes: withoutSiblings}, {replace: true})
  }, [navigate, layoutCollapsed, routerPanes])

  // Handle old-style URLs
  useEffect(() => {
    const {template: templateName, ...payloadParams} = params
    const template = getTemplateById(templateName)
    const type = (template && template.schemaType) || schemaType
    const shouldRewrite = (action === 'edit' && legacyEditDocumentId) || (type && editDocumentId)

    if (!shouldRewrite) {
      return
    }

    navigate(
      getIntentRouteParams({
        id: editDocumentId || legacyEditDocumentId,
        type,
        payloadParams,
        templateName,
      }),
      {replace: true}
    )
  }, [action, editDocumentId, legacyEditDocumentId, navigate, params, schemaType])

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

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [pushToast])

  useEffect(() => {
    prevRouterPanesRef.current = currRouterPanesRef.current
    currRouterPanesRef.current = routerPanes
  }, [routerPanes])

  useEffect(() => {
    const structure$ = structure$Ref.current

    if (!structure$) return undefined

    const _resolvedPanes = resolvedPanesRef.current
    const prevPanes = prevRouterPanesRef.current
    const nextPanes = currRouterPanesRef.current
    const fromIndex = getPaneDiffIndex(nextPanes, prevPanes) || [0, 0]

    const resolvedPanes$ = structure$.pipe(
      switchMap((structure) => resolvePanes(structure, routerPanes, _resolvedPanes, fromIndex)),
      switchMap((_panes) =>
        hasLoading(_panes) ? of(_panes).pipe(debounce(() => interval(50))) : of(_panes)
      )
    )

    const sub = resolvedPanes$.subscribe({
      next(value) {
        setResolvedPanes(value)
        resolvedPanesRef.current = value
      },
      error(err) {
        setResolveError(err)
      },
    })

    return () => sub.unsubscribe()
  }, [routerPanes, setResolveError, setResolvedPanes])

  useEffect(() => onPaneChange(resolvedPanes), [onPaneChange, resolvedPanes])

  const children = useMemo(() => {
    if (panes.length === 0) return null

    return panes.map((paneData) => {
      const {
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
      } = paneData

      if (pane === LOADING_PANE) {
        return (
          <LoadingPane
            key={`loading-${paneIndex}`}
            path={path}
            index={paneIndex}
            message={getWaitMessages}
            selected={selected}
          />
        )
      }

      return (
        <DeskToolPane
          active={active}
          groupIndex={groupIndex}
          index={paneIndex}
          key={`${pane.type}-${paneIndex}`}
          pane={pane}
          childItemId={childItemId}
          itemId={itemId}
          paneKey={paneKey}
          params={paneParams}
          payload={payload}
          selected={selected}
          siblingIndex={siblingIndex}
        />
      )
    })
  }, [panes])

  return useMemo(() => {
    if (error) {
      return <StructureError error={error} />
    }

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
            {children}
          </StyledPaneLayout>
          <div data-portal="" ref={setPortalElement} />
        </PortalProvider>
      </DeskToolProvider>
    )
  }, [children, error, handleRootCollapse, handleRootExpand, layoutCollapsed, portalElement])
}
