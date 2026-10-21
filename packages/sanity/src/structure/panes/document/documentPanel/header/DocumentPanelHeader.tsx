import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {CloseIcon} from '@sanity/icons/Close'
import {CollapseIcon} from '@sanity/icons/Collapse'
import {ExpandIcon} from '@sanity/icons/Expand'
import {SplitVerticalIcon} from '@sanity/icons/SplitVertical'
import {useTelemetry} from '@sanity/telemetry/react'
import {Card} from '@sanity/ui'
import {getTheme_v2, rgba} from '@sanity/ui/theme'
import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
} from 'react'
import {
  FieldPresenceInner,
  type DocumentActionDescription,
  useDocumentPresence,
  useFieldActions,
  useTranslation,
  useZIndex,
  useWorkspace,
} from 'sanity'
import {css, styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {TooltipDelayGroupProvider} from '../../../../../ui-components/tooltipDelayGroupProvider/TooltipDelayGroupProvider'
import {PaneContextMenuButton} from '../../../../components/pane/PaneContextMenuButton'
import {PaneHeader} from '../../../../components/pane/PaneHeader'
import {PaneHeaderActionButton} from '../../../../components/pane/PaneHeaderActionButton'
import {type _PaneMenuNode} from '../../../../components/pane/types'
import {usePane} from '../../../../components/pane/usePane'
import {usePaneRouter} from '../../../../components/paneRouter/usePaneRouter'
import {
  RenderActionCollectionState,
  type ResolvedAction,
} from '../../../../components/RenderActionCollectionState'
import {useHistoryRestoreAction} from '../../../../documentActions/HistoryRestoreAction'
import {structureLocaleNamespace} from '../../../../i18n'
import {isMenuNodeButton, isNotMenuNodeButton, resolveMenuNodes} from '../../../../menuNodes'
import {useResolvedPanesList} from '../../../../structureResolvers/useResolvedPanesList'
import {type PaneMenuItem} from '../../../../types'
import {useStructureTool} from '../../../../useStructureTool'
import {INSPECT_ACTION_PREFIX, VALIDATION_INSPECTOR_NAME} from '../../constants'
import {ActionDialogWrapper, ActionMenuListItem} from '../../statusBar/ActionMenuButton'
import {useDocumentPane} from '../../useDocumentPane'
import {useDocumentPaneExtension} from '../DocumentPaneExtension'
import {DocumentPaneCollapsed, DocumentPaneMaximized} from './__telemetry__/focus.telemetry'
import {CommandsMenuButton} from './CommandsMenuButton'
import {CopyDocumentActions} from './CopyDocumentActions'
import {DocumentGroupInventoryHint} from './documentGroupInventoryHint/DocumentGroupInventoryHint'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'
import {DocumentTargetBadges} from './DocumentTargetBadges'
import {useChipScrollPosition} from './hook/useChipScrollPosition'
import {DocumentPerspectiveList} from './perspective/DocumentPerspectiveList'

export interface DocumentPanelHeaderProps {
  menuItems: PaneMenuItem[]
}

const HorizontalScroller = styled(Card)<{$showGradient: boolean}>((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    scrollbar-width: none;
    z-index: 1;
    flex: 1;
    position: relative;
    > div {
      &::-webkit-scrollbar {
        width: 0;
        height: 0;
      }
    }

    ${
      props.$showGradient &&
      css`
        &::after {
          content: '';
          display: block;
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          width: 150px;
          background: linear-gradient(to right, ${rgba(theme.color.bg, 0)}, var(--card-bg-color));
          transition: 'opacity 300ms ease-out';
          pointer-events: none;
        }
      `
    }
  `
})

export const DocumentPanelHeader = memo(function DocumentPanelHeader(
  _props: DocumentPanelHeaderProps & RefAttributes<HTMLDivElement>,
) {
  const {ref, menuItems} = _props
  const {
    editState,
    onMenuAction,
    onPaneClose,
    onPaneSplit,
    onSetMaximizedPane,
    menuItemGroups,
    schemaType,
    connectionState,
    views,
    unstable_languageFilter,
    documentId,
  } = useDocumentPane()
  const {features} = useStructureTool()
  const {beta} = useWorkspace()
  const {index, BackLink, hasGroupSiblings} = usePaneRouter()
  const {maximizedPane} = useResolvedPanesList()
  const {actions: fieldActions} = useFieldActions()
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const showGradient = useChipScrollPosition(scrollContainerRef)
  const telemetry = useTelemetry()
  const paneExtension = useDocumentPaneExtension({documentId, documentType: schemaType.name})
  const zIndex = useZIndex()
  const paneHeaderZIndex = Array.isArray(zIndex.paneHeader)
    ? zIndex.paneHeader[1]
    : zIndex.paneHeader

  const compact = paneExtension?.compactHeader === true

  // Compact: only commands stay in the "..." menu. The inspector entries are tabs (the validation one stays a button, it only shows with problems),
  // Inline changes is a switch in Review changes, Share is a menu command.
  const headerMenuItems = useMemo(() => {
    if (!compact) return menuItems
    const order = [
      'compareVersions',
      'inspect',
      'production-preview',
      `${INSPECT_ACTION_PREFIX}${VALIDATION_INSPECTOR_NAME}`,
    ]
    return order.flatMap((action) => menuItems.filter((item) => item.action === action))
  }, [compact, menuItems])

  const menuNodes = useMemo(
    () =>
      resolveMenuNodes({
        actionHandler: onMenuAction,
        fieldActions: compact ? [] : fieldActions,
        menuItems: headerMenuItems,
        menuItemGroups,
      }),
    [compact, onMenuAction, fieldActions, menuItemGroups, headerMenuItems],
  )
  const documentCommandNodes = useMemo(
    () =>
      compact
        ? resolveMenuNodes({
            actionHandler: onMenuAction,
            fieldActions,
            menuItems: [],
            menuItemGroups: [],
          })
        : [],
    [compact, onMenuAction, fieldActions],
  )

  const menuButtonNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])
  const contextMenuNodes = useMemo(() => menuNodes.filter(isNotMenuNodeButton), [menuNodes])
  const hasDocumentGroupInventory = beta?.documentGroupInventory?.enabled === true

  const {collapsed, isLast} = usePane()
  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  // there are three kinds of buttons possible:
  //
  // 1. split pane - creates a new split pane
  // 2. close split pane — closes the current split pane
  // 3. close pane group — closes the current pane group

  // show the split pane button if they're enabled and there is more than one
  // view available to use to create a split view
  const showSplitPaneButton = features.splitViews && onPaneSplit && views.length > 1

  // show the split pane button close button if the split button is showing
  // and there is more than one split pane open (aka has-siblings)
  const showSplitPaneCloseButton = showSplitPaneButton && hasGroupSiblings

  // show the back button if both the feature is enabled and the current pane
  // is not the first
  const showBackButton = features.backButton && index > 0

  // show the pane group close button if the `showSplitPaneCloseButton` is
  // _not_ showing (the split pane button replaces the group close button)
  // and if the back button is not showing (the back button and the close
  // button do the same thing and shouldn't be shown at the same time)
  // and if a BackLink component was provided
  const showPaneGroupCloseButton = !showSplitPaneCloseButton && !showBackButton && !!BackLink

  const {t} = useTranslation(structureLocaleNamespace)
  const presence = useDocumentPresence(documentId)
  const documentLevelPresence = useMemo(
    () => presence.filter((p) => p.path.length === 0),
    [presence],
  )

  const isMaximizedPane = useMemo(() => {
    return (
      maximizedPane?.pane &&
      typeof maximizedPane.pane === 'object' &&
      maximizedPane.pane.type === 'document' &&
      maximizedPane.pane.options.id === documentId
    )
  }, [maximizedPane, documentId])

  const handleFocusPane = useCallback(() => {
    onSetMaximizedPane?.()

    if (isMaximizedPane) {
      telemetry.log(DocumentPaneCollapsed)
    } else {
      telemetry.log(DocumentPaneMaximized)
    }
  }, [onSetMaximizedPane, isMaximizedPane, telemetry])

  const title = useMemo(() => <DocumentHeaderTitle />, [])
  const backButton = useMemo(
    () =>
      showBackButton && (
        <Button
          as={BackLink}
          data-as="a"
          icon={ArrowLeftIcon}
          mode="bleed"
          tooltipProps={{content: t('pane-header.back-button.text')}}
        />
      ),
    [BackLink, showBackButton, t],
  )

  return (
    <TooltipDelayGroupProvider>
      {collapsed ? (
        <PaneHeader
          border
          ref={ref}
          loading={connectionState === 'connecting' && !editState?.draft && !editState?.published}
          title={title}
          tabIndex={tabIndex}
          backButton={backButton}
        />
      ) : (
        <Card
          hidden={collapsed}
          style={{lineHeight: 0, position: 'relative', zIndex: paneHeaderZIndex}}
          borderBottom
          borderTop={compact}
        >
          <Flex
            gap={3}
            paddingY={compact ? 0 : 3}
            // 45 px in all, borders included: a 29 px control, 7 px above and below, and the 1 px borders.
            style={compact ? {paddingBlock: 7} : undefined}
            justifyContent="space-between"
            alignItems="center"
            data-compact-header={compact ? '' : undefined}
          >
            {/* PROPOSED: a host's pills (C2) are drawn in both layouts and then replace the document group inventory row. */}
            {(!hasDocumentGroupInventory || paneExtension?.pills) && (
              <HorizontalScroller $showGradient={showGradient}>
                <Flex
                  flexBasis="0%"
                  flexGrow={1}
                  gap={1}
                  overflow="auto"
                  paddingX={3}
                  data-testid="document-perspective-list"
                  ref={scrollContainerRef}
                >
                  {/* PROPOSED: a host's pills replace the stock ones, they do not sit beside them. */}
                  {paneExtension?.pills ?? <DocumentPerspectiveList />}
                </Flex>
              </HorizontalScroller>
            )}
            {hasDocumentGroupInventory && !paneExtension?.pills && (
              <HorizontalScroller $showGradient={false}>
                <Flex
                  flexBasis="0%"
                  flexGrow={1}
                  gap={2}
                  alignItems="center"
                  overflow="auto"
                  paddingX={3}
                  data-testid="document-target-badges"
                  style={{minWidth: 0}}
                >
                  <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                    <DocumentTargetBadges />
                  </Box>
                  <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                    <DocumentGroupInventoryHint />
                  </Box>
                </Flex>
              </HorizontalScroller>
            )}

            <Box flexBasis="auto" flexGrow={0} flexShrink={0} paddingRight={3}>
              <Flex alignItems="center" gap={1}>
                {documentLevelPresence.length > 0 && (
                  <Box data-testid="document-level-presence" marginRight={2}>
                    <FieldPresenceInner presence={documentLevelPresence} stack />
                  </Box>
                )}
                {unstable_languageFilter.length > 0 && (
                  <>
                    {unstable_languageFilter.map((LanguageFilterComponent, idx) => {
                      return (
                        <LanguageFilterComponent
                          key={`language-filter-${idx}`}
                          schemaType={schemaType}
                        />
                      )
                    })}
                  </>
                )}

                {!compact && <CopyDocumentActions />}
                {menuButtonNodes.map((item) => (
                  <PaneHeaderActionButton key={item.key} node={item} />
                ))}
                {editState && (
                  <RenderActionCollectionState group="paneActions">
                    {({states}) => (
                      <DocumentPanelHeaderActionDialogDeferred
                        commandGroups={
                          compact
                            ? groupCommands(contextMenuNodes, documentCommandNodes)
                            : undefined
                        }
                        contextMenuNodes={contextMenuNodes}
                        setReferenceElement={setReferenceElement}
                        referenceElement={referenceElement}
                        states={states}
                      />
                    )}
                  </RenderActionCollectionState>
                )}

                {showSplitPaneButton && (
                  <Button
                    key="split-pane-button"
                    aria-label={t('buttons.split-pane-button.aria-label')}
                    icon={SplitVerticalIcon}
                    mode="bleed"
                    onClick={onPaneSplit}
                    tooltipProps={{content: t('buttons.split-pane-button.tooltip')}}
                  />
                )}

                {onSetMaximizedPane && (
                  <Button
                    key="focus-pane-button"
                    aria-label={
                      isMaximizedPane
                        ? t('buttons.focus-pane-button.aria-label.collapse')
                        : t('buttons.focus-pane-button.aria-label.focus')
                    }
                    icon={isMaximizedPane ? CollapseIcon : ExpandIcon}
                    mode="bleed"
                    onClick={handleFocusPane}
                    tooltipProps={{
                      content: isMaximizedPane
                        ? t('buttons.focus-pane-button.tooltip.collapse')
                        : t('buttons.focus-pane-button.tooltip.focus'),
                    }}
                    data-testid={
                      isMaximizedPane ? 'focus-pane-button-collapse' : 'focus-pane-button-focus'
                    }
                  />
                )}

                {showSplitPaneCloseButton && (
                  <Button
                    key="close-view-button"
                    icon={CloseIcon}
                    mode="bleed"
                    onClick={onPaneClose}
                    tooltipProps={{content: t('buttons.split-pane-close-button.title')}}
                  />
                )}

                {showPaneGroupCloseButton && (
                  <Button
                    key="close-view-button"
                    icon={CloseIcon}
                    mode="bleed"
                    tooltipProps={{content: t('buttons.split-pane-close-group-button.title')}}
                    as={BackLink}
                  />
                )}
              </Flex>
            </Box>
          </Flex>
        </Card>
      )}
    </TooltipDelayGroupProvider>
  )
})

/**
 * The compact header's command groups, in the order of the menu: pane commands (Compare versions, Inspect, Open preview), then the document's
 * field commands (Copy and Paste document). Create new task and Share follow, added by the menu itself.
 */
function groupCommands(
  paneNodes: _PaneMenuNode[],
  documentNodes: _PaneMenuNode[],
): _PaneMenuNode[][] {
  const flat = paneNodes.flatMap((node) => (node.type === 'group' ? node.children : [node]))
  return [
    flat.filter((node) => node.type === 'item'),
    documentNodes.filter((node) => node.type !== 'divider'),
  ]
}

const DocumentPanelHeaderActionDialogDeferred = memo(
  function DocumentPanelHeaderActionDialogDeferred(props: {
    commandGroups?: _PaneMenuNode[][]
    states: ResolvedAction[]
    setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
    referenceElement: HTMLElement | null
    contextMenuNodes: _PaneMenuNode[]
  }) {
    const {setReferenceElement, referenceElement, contextMenuNodes} = props
    /**
     * The purpose of this component is to allow deferring the rendering of document action hook states if the main thread becomes very busy.
     * The `useDeferredValue` doesn't have an effect unless it's used to delay rendering a component that has `React.memo` to prevent unnecessary re-renders.
     */
    const states = useDeferredValue(props.states)

    return (
      <DocumentPanelHeaderActionDialog
        commandGroups={props.commandGroups}
        setReferenceElement={setReferenceElement}
        referenceElement={referenceElement}
        contextMenuNodes={contextMenuNodes}
        // The restore action has a dedicated place in the UI; it's only visible when the user is
        // viewing a different document revision. It must be omitted from this collection.
        states={states.filter((state) =>
          state.action ? state.action !== useHistoryRestoreAction.action : true,
        )}
      />
    )
  },
)

const DocumentPanelHeaderActionDialog = memo(function DocumentPanelHeaderActionDialog(props: {
  commandGroups?: _PaneMenuNode[][]
  states: DocumentActionDescription[]
  setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  referenceElement: HTMLElement | null
  contextMenuNodes: _PaneMenuNode[]
}) {
  const {states, setReferenceElement, contextMenuNodes, referenceElement, commandGroups} = props

  const renderActionDialog = useCallback<
    ({handleAction}: {handleAction: (idx: number) => void}) => React.ReactNode
  >(
    ({handleAction}) => {
      const actionsNodes =
        states.length > 0
          ? states.map((actionState, actionIndex) => (
              <ActionMenuListItem
                key={actionState.label}
                actionState={actionState}
                disabled={Boolean(actionState.disabled)}
                index={actionIndex}
                onAction={handleAction}
              />
            ))
          : undefined
      if (commandGroups) {
        return (
          <div ref={setReferenceElement}>
            <CommandsMenuButton actionsNodes={actionsNodes} groups={commandGroups} />
          </div>
        )
      }
      return (
        <div ref={setReferenceElement}>
          <PaneContextMenuButton
            key="context-menu"
            nodes={contextMenuNodes}
            actionsNodes={actionsNodes}
          />
        </div>
      )
    },
    [commandGroups, contextMenuNodes, setReferenceElement, states],
  )

  return (
    <ActionDialogWrapper actionStates={states} referenceElement={referenceElement}>
      {renderActionDialog}
    </ActionDialogWrapper>
  )
})
