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
  const {paneDataItems, resolvedPanes, setMaximisedPane, maximisedPane} = resolvedPanesValue
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

  // When a pane is focused, show only from that pane up to and including its group
  // It's important to use the last index as there might be panes that have the same document (so ids and such)
  // But the structure should be kept
  const maximisedLastIndex = paneDataItems.findLastIndex((pane) => pane.maximised)
  const paneItemsToShow =
    maximisedLastIndex === -1
      ? paneDataItems
      : paneDataItems
          .slice(maximisedLastIndex)
          .filter((pane) => pane.groupIndex <= paneDataItems[maximisedLastIndex].groupIndex)

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

  const onSetMaximisedPane = useCallback(
    (paneData: (typeof paneDataItems)[number] | null) => {
      if (!paneData) return

      const currentPanes = (routerState?.panes || []) as RouterPanes

      if (paneData.maximised) {
        setMaximisedPane(null)
        // Resets all the panes to the current state
        navigate({
          panes: currentPanes,
        })
        return
      }

      // Only allow document panes to be focused
      if (paneData.pane !== LOADING_PANE && paneData.pane.type === 'document') {
        // Navigate to this pane, closing all panes after it
        const slicedPanes = currentPanes.slice(0, paneData.groupIndex)
        setMaximisedPane(paneData)
        navigate({
          panes: slicedPanes,
        })
      }
    },
    [navigate, routerState?.panes, setMaximisedPane],
  )

  const previousSelectedIndexRef = useRef(-1)

  // Manage focused pane: sync with navigation and handle cleanup
  useEffect(() => {
    const selectedIndex = paneDataItems.findIndex((pane) => pane.selected)
    const prevSelectedIndex = previousSelectedIndexRef.current
    previousSelectedIndexRef.current = selectedIndex

    if (!maximisedPane) return

    // Clear focus if the focused pane is not a document pane (focus only works with documents)
    if (maximisedPane.pane !== LOADING_PANE && maximisedPane.pane.type !== 'document') {
      setMaximisedPane(null)
      return
    }

    // When navigating in focus mode, update focus to follow the newly selected pane
    // This ensures opening a document to the right works correctly even when they were opened previously
    if (selectedIndex !== -1 && selectedIndex !== prevSelectedIndex) {
      const selectedPane = paneDataItems[selectedIndex]
      // Only set focus if the newly selected pane is a document pane
      setMaximisedPane(selectedPane)

      return
    }

    // Clean up or find fallback when focused pane no longer exists
    const isMaximisedPanePresent = paneDataItems.some((pane) => pane.key === maximisedPane.key)

    if (!isMaximisedPanePresent) {
      const fallbackPane = paneDataItems.find(
        (pane) =>
          pane.groupIndex === maximisedPane.groupIndex &&
          pane.siblingIndex === maximisedPane.siblingIndex &&
          pane.pane !== LOADING_PANE &&
          pane.pane.type === 'document',
      )
      setMaximisedPane(fallbackPane || null)
    }
  }, [maximisedPane, paneDataItems, setMaximisedPane])

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
              maximised,
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
                    maximised={maximised}
                    onSetMaximisedPane={() => onSetMaximisedPane(paneData)}
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
