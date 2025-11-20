import {PortalProvider, useTheme, useToast} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {Fragment, memo, useCallback, useEffect, useRef, useState} from 'react'
import {_isCustomDocumentTypeDefinition, useSchema} from 'sanity'
import {useRouter, useRouterState} from 'sanity/router'
import {styled} from 'styled-components'

import {LOADING_PANE} from '../../constants'
import {LoadingPane, StructureToolPane} from '../../panes'
import {ResolvedPanesProvider, useResolvedPanes} from '../../structureResolvers'
import {type PaneNode, type RouterPanes} from '../../types'
import {useStructureTool} from '../../useStructureTool'
import {PaneLayout} from '../pane'
import {NoDocumentTypesScreen} from './NoDocumentTypesScreen'
import {StructureTitle} from './StructureTitle'

interface StructureToolProps {
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
export const StructureTool = memo(function StructureTool({onPaneChange}: StructureToolProps) {
  const {push: pushToast} = useToast()
  const schema = useSchema()
  const {navigate} = useRouter()
  const routerState = useRouterState()
  const {layoutCollapsed, setLayoutCollapsed} = useStructureTool()
  const resolvedPanesValue = useResolvedPanes()
  const {paneDataItems, resolvedPanes, setMaximizedPane, maximizedPane} = resolvedPanesValue
  // Intent resolving is processed by the sibling `<IntentResolver />` but it doesn't have a UI for indicating progress.
  // We handle that here, so if there are only 1 pane (the root structure), and there's an intent state in the router, we need to show a placeholder LoadingPane until
  // the structure is resolved and we know what panes to load/display
  const isResolvingIntent = useRouterState(
    useCallback((state) => typeof state.intent === 'string', []),
  )
  const {
    sanity: {media},
  } = useTheme()

  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null)

  const handleRootCollapse = useCallback(() => setLayoutCollapsed(true), [setLayoutCollapsed])
  const handleRootExpand = useCallback(() => setLayoutCollapsed(false), [setLayoutCollapsed])

  /* When a pane is maximised, show only from that pane up to and including itself
   * - Take the deepest maximised pane.
   * - Combine with all panes that are deeper than it that are in the same group, or an ancestral group.
   * - Only show these matching panes.
   */
  const maximizedLastIndex = paneDataItems.findLastIndex((pane) => pane.maximized)
  const paneItemsToShow =
    maximizedLastIndex === -1
      ? paneDataItems
      : paneDataItems
          .slice(maximizedLastIndex)
          .filter((pane) => pane.groupIndex <= paneDataItems[maximizedLastIndex].groupIndex)

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

  const onSetMaximizedPane = useCallback(
    (paneData: (typeof paneDataItems)[number] | null) => {
      if (!paneData) return

      const currentPanes = (routerState?.panes || []) as RouterPanes

      if (paneData.maximized) {
        setMaximizedPane(null)
        // Resets all the panes to the current state
        navigate({
          panes: currentPanes,
        })
        return
      }

      // Only allow document panes to be maximised
      if (paneData.pane !== LOADING_PANE && paneData.pane.type === 'document') {
        // Navigate to this pane, closing all panes after it
        const slicedPanes = currentPanes.slice(0, paneData.groupIndex)
        setMaximizedPane(paneData)
        navigate({
          panes: slicedPanes,
        })
      }
    },
    [navigate, routerState?.panes, setMaximizedPane],
  )

  const previousSelectedIndexRef = useRef(-1)

  // Manage maximised pane: sync with navigation and handle cleanup
  useEffect(() => {
    const selectedIndex = paneDataItems.findIndex((pane) => pane.selected)
    const prevSelectedIndex = previousSelectedIndexRef.current
    previousSelectedIndexRef.current = selectedIndex

    if (!maximizedPane) return

    // Clear focus if the maximised pane is not a document pane (focus only works with documents)
    if (maximizedPane.pane !== LOADING_PANE && maximizedPane.pane.type !== 'document') {
      setMaximizedPane(null)
      return
    }

    // When navigating in focus mode, update focus to follow the newly selected pane
    // This ensures opening a document to the right works correctly even when they were opened previously
    if (selectedIndex !== -1 && selectedIndex !== prevSelectedIndex) {
      const selectedPane = paneDataItems[selectedIndex]
      // Only set focus if the newly selected pane is a document pane
      setMaximizedPane(selectedPane)

      return
    }

    // Clean up or find fallback when maximised pane no longer exists
    const isMaximizedPanePresent = paneDataItems.some((pane) => pane.key === maximizedPane.key)

    if (!isMaximizedPanePresent) {
      const fallbackPane = paneDataItems.find(
        (pane) =>
          pane.groupIndex === maximizedPane.groupIndex &&
          pane.siblingIndex === maximizedPane.siblingIndex &&
          pane.pane !== LOADING_PANE &&
          pane.pane.type === 'document',
      )
      setMaximizedPane(fallbackPane || null)
    }
  }, [maximizedPane, paneDataItems, setMaximizedPane])

  if (!hasDefinedDocumentTypes) {
    return <NoDocumentTypesScreen />
  }

  return (
    <ResolvedPanesProvider value={resolvedPanesValue}>
      <PortalProvider element={portalElement || null}>
        <StyledPaneLayout
          flex={1}
          height={layoutCollapsed ? undefined : 'fill'}
          minWidth={media[1]}
          onCollapse={handleRootCollapse}
          onExpand={handleRootExpand}
        >
          {paneItemsToShow.map((paneData) => {
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
              maximized,
            } = paneData
            return (
              <Fragment key={`${pane === LOADING_PANE ? 'loading' : pane.type}-${paneIndex}`}>
                {pane === LOADING_PANE ? (
                  <LoadingPane paneKey={paneKey} path={path} selected={selected} />
                ) : (
                  <StructureToolPane
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
                    maximized={maximized}
                    onSetMaximizedPane={() => onSetMaximizedPane(paneData)}
                  />
                )}
              </Fragment>
            )
          })}
          {/* If there's just 1 pane (the root), or less, and we're resolving an intent then it's necessary to show */}
          {/* a loading indicator as the intent resolving is async, could take a while and can also be interrupted/redirected */}
          {paneDataItems.length <= 1 && isResolvingIntent && (
            <LoadingPane paneKey="intent-resolver" />
          )}
        </StyledPaneLayout>
        <StructureTitle resolvedPanes={resolvedPanes} />
        <div data-portal="" ref={setPortalElement} />
      </PortalProvider>
    </ResolvedPanesProvider>
  )
})
