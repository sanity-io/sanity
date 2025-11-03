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
  const {paneDataItems, resolvedPanes, setFocusedPane, focusedPane} = resolvedPanesValue
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

  const onSetFocusedPane = useCallback(
    (paneData: (typeof paneDataItems)[number] | null) => {
      if (!paneData) return

      const currentPanes = (routerState?.panes || []) as RouterPanes

      if (paneData.focused) {
        setFocusedPane(null)
        // Resets all the panes to the current state
        navigate({
          panes: currentPanes,
        })
      } else {
        // Navigate to this pane, closing all panes after it
        const slicedPanes = currentPanes.slice(0, paneData.groupIndex)
        setFocusedPane(paneData)
        navigate({
          panes: slicedPanes,
        })
      }
    },
    [navigate, routerState?.panes, setFocusedPane],
  )

  const previousSelectedIndexRef = useRef(-1)

  // When navigating while focused, move focus to the newly selected pane
  // This is especially important for situations where there are multiple panes
  // That can reference the same document at different levels of the pane hierarchy.
  useEffect(() => {
    const selectedIndex = paneDataItems.findIndex((pane) => pane.selected)
    const prevSelectedIndex = previousSelectedIndexRef.current

    // Only act if we have a focused pane and the selected index actually changed
    if (focusedPane && selectedIndex !== -1 && selectedIndex !== prevSelectedIndex) {
      // If the newly selected pane is different from the focused pane, focus it
      if (selectedIndex !== focusedPane.index) {
        const selectedPane = paneDataItems[selectedIndex]
        setFocusedPane(selectedPane)
      }
    }

    previousSelectedIndexRef.current = selectedIndex
  }, [focusedPane, paneDataItems, setFocusedPane])

  // Clear focused pane when it no longer exists in the pane list
  // This is especially important for situations where there are multiple panes that are open
  // And the focus pane is in the middle, and panes that existed no longer exist but we still want to navigate to them
  useEffect(() => {
    if (!focusedPane) return

    const isFocusedPanePresent = paneDataItems.some((pane) => pane.key === focusedPane.key)

    if (isFocusedPanePresent) {
      return
    }

    const fallbackPane = paneDataItems.find(
      (pane) =>
        pane.groupIndex === focusedPane.groupIndex &&
        pane.siblingIndex === focusedPane.siblingIndex,
    )

    if (fallbackPane) {
      setFocusedPane(fallbackPane)
    } else {
      setFocusedPane(null)
    }
  }, [focusedPane, paneDataItems, setFocusedPane])

  if (!hasDefinedDocumentTypes) {
    return <NoDocumentTypesScreen />
  }

  const focusedIndex = paneDataItems.findLastIndex((paneData) => paneData.focused)

  // When a pane is focused, show from that pane onward, but limit to only show
  // up to and including the focused pane (hide subsequent panes)
  let filteredOnlyDocs = paneDataItems
  if (focusedIndex !== -1) {
    const focusedPaneData = paneDataItems[focusedIndex]
    // Show panes from the focused index, but only up to the focused pane's groupIndex + 1
    filteredOnlyDocs = paneDataItems
      .slice(focusedIndex)
      .filter((pane) => pane.groupIndex <= focusedPaneData.groupIndex)
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
          {filteredOnlyDocs.map((paneData) => {
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
              focused,
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
                    focused={focused}
                    onSetFocusedPane={() => onSetFocusedPane(paneData)}
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
