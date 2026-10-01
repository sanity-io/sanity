import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
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
  EMPTY_ARRAY,
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
import {
  hasMenuNodeContent,
  isMenuNodeButton,
  isNotMenuNodeButton,
  resolveMenuNodes,
} from '../../../../menuNodes'
import {type PaneMenuItem} from '../../../../types'
import {useStructureTool} from '../../../../useStructureTool'
import {ActionDialogWrapper, ActionMenuListItem} from '../../statusBar/ActionMenuButton'
import {useDocumentFeatures} from '../../useDocumentFeatures'
import {useDocumentPane} from '../../useDocumentPane'
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
  props: DocumentPanelHeaderProps & RefAttributes<HTMLDivElement>,
) {
  const {ref, menuItems} = props
  const {editState} = useDocumentPane()

  if (editState) {
    return (
      <RenderActionCollectionState group="paneActions">
        {({states}) => <DocumentPanelHeaderBar ref={ref} menuItems={menuItems} states={states} />}
      </RenderActionCollectionState>
    )
  }

  return <DocumentPanelHeaderBar ref={ref} menuItems={menuItems} states={EMPTY_ARRAY} />
})

const DocumentPanelHeaderBar = memo(function DocumentPanelHeaderBar(
  props: {
    menuItems: PaneMenuItem[]
    states: ResolvedAction[]
  } & RefAttributes<HTMLDivElement>,
) {
  const {ref, menuItems, states} = props
  const {
    editState,
    onMenuAction,
    menuItemGroups,
    schemaType,
    connectionState,
    unstable_languageFilter,
    documentId,
  } = useDocumentPane()
  const {beta} = useWorkspace()
  const {byName, header: headerFeatures, menu: menuFeatures} = useDocumentFeatures()
  const showVersionPicker = byName.has('versionPicker')
  const showCopyActions = byName.has('copyActions')
  const {features: structureFeatures} = useStructureTool()
  const {BackLink, index} = usePaneRouter()
  const {actions: fieldActions} = useFieldActions()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const showGradient = useChipScrollPosition(scrollContainerRef)
  const zIndex = useZIndex()
  const paneHeaderZIndex = Array.isArray(zIndex.paneHeader)
    ? zIndex.paneHeader[1]
    : zIndex.paneHeader

  const menuNodes = useMemo(
    () =>
      resolveMenuNodes({
        actionHandler: onMenuAction,
        fieldActions,
        menuItems,
        menuItemGroups,
        menuFeatures,
      }),
    [onMenuAction, fieldActions, menuItemGroups, menuItems, menuFeatures],
  )

  const menuButtonNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])
  const contextMenuNodes = useMemo(() => menuNodes.filter(isNotMenuNodeButton), [menuNodes])
  const hasDocumentGroupInventory = beta?.documentGroupInventory?.enabled === true

  const {collapsed, isLast} = usePane()
  // Prevent focus if this is the last (non-collapsed) pane.
  const tabIndex = isLast && !collapsed ? -1 : 0

  const {t} = useTranslation(structureLocaleNamespace)
  const presence = useDocumentPresence(documentId)
  const documentLevelPresence = useMemo(
    () => presence.filter((p) => p.path.length === 0),
    [presence],
  )
  const showBackButton = structureFeatures.backButton && index > 0

  const title = useMemo(() => <DocumentHeaderTitle />, [])
  const backButtonNode = useMemo(
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

  const hasContextMenuContent = contextMenuNodes.some(hasMenuNodeContent)
  // An empty bordered bar is worse than no bar, so the header is dropped once nothing fills it.
  const hasHeaderContent =
    headerFeatures.length > 0 ||
    menuButtonNodes.length > 0 ||
    unstable_languageFilter.length > 0 ||
    documentLevelPresence.length > 0 ||
    showVersionPicker ||
    showCopyActions ||
    (Boolean(editState) && (hasContextMenuContent || states.length > 0))

  if (!hasHeaderContent) return null

  return (
    <TooltipDelayGroupProvider>
      {collapsed ? (
        <PaneHeader
          border
          ref={ref}
          loading={connectionState === 'connecting' && !editState?.draft && !editState?.published}
          title={title}
          tabIndex={tabIndex}
          backButton={backButtonNode}
        />
      ) : (
        <Card
          hidden={collapsed}
          style={{lineHeight: 0, position: 'relative', zIndex: paneHeaderZIndex}}
          borderBottom
        >
          <Flex gap={3} paddingY={3} justifyContent="flex-end" alignItems="center">
            {showVersionPicker && !hasDocumentGroupInventory && (
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
                  <DocumentPerspectiveList />
                </Flex>
              </HorizontalScroller>
            )}
            {showVersionPicker && hasDocumentGroupInventory && (
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

                {showCopyActions && <CopyDocumentActions />}
                {menuButtonNodes.map((item) => (
                  <PaneHeaderActionButton key={item.key} node={item} />
                ))}
                {editState && (
                  <DocumentPanelHeaderActionDialogDeferred
                    contextMenuNodes={contextMenuNodes}
                    states={states}
                  />
                )}
                {headerFeatures.map(({name, toolbar: {render: Entry}}) => (
                  <Entry key={name} />
                ))}
              </Flex>
            </Box>
          </Flex>
        </Card>
      )}
    </TooltipDelayGroupProvider>
  )
})

const DocumentPanelHeaderActionDialogDeferred = memo(
  function DocumentPanelHeaderActionDialogDeferred(props: {
    states: ResolvedAction[]
    contextMenuNodes: _PaneMenuNode[]
  }) {
    const {contextMenuNodes} = props
    /**
     * The purpose of this component is to allow deferring the rendering of document action hook states if the main thread becomes very busy.
     * The `useDeferredValue` doesn't have an effect unless it's used to delay rendering a component that has `React.memo` to prevent unnecessary re-renders.
     */
    const states = useDeferredValue(props.states)

    return (
      <DocumentPanelHeaderActionDialog
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
  states: DocumentActionDescription[]
  contextMenuNodes: _PaneMenuNode[]
}) {
  const {states, contextMenuNodes} = props
  const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

  const renderActionDialog = useCallback<
    ({handleAction}: {handleAction: (idx: number) => void}) => React.ReactNode
  >(
    ({handleAction}) => (
      <div ref={setReferenceElement}>
        <PaneContextMenuButton
          key="context-menu"
          nodes={contextMenuNodes}
          actionsNodes={
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
          }
        />
      </div>
    ),
    [contextMenuNodes, setReferenceElement, states],
  )

  // An overflow button with an empty menu is a dead affordance, so it is derived from its own
  // contents rather than configured.
  if (states.length === 0 && !contextMenuNodes.some(hasMenuNodeContent)) return null

  return (
    <ActionDialogWrapper actionStates={states} referenceElement={referenceElement}>
      {renderActionDialog}
    </ActionDialogWrapper>
  )
})
