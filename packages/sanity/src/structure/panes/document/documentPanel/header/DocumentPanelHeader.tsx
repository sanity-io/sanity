import {ArrowLeftIcon, CloseIcon, SplitVerticalIcon} from '@sanity/icons'
import {Flex} from '@sanity/ui'
import {
  createElement,
  type ForwardedRef,
  forwardRef,
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react'
import {
  type DocumentActionDescription,
  useFieldActions,
  useTimelineSelector,
  useTranslation,
} from 'sanity'

import {Button, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {
  PaneContextMenuButton,
  PaneHeader,
  PaneHeaderActionButton,
  RenderActionCollectionState,
  usePane,
  usePaneRouter,
} from '../../../../components'
import {type _PaneMenuNode} from '../../../../components/pane/types'
import {structureLocaleNamespace} from '../../../../i18n'
import {isMenuNodeButton, isNotMenuNodeButton, resolveMenuNodes} from '../../../../menuNodes'
import {type PaneMenuItem} from '../../../../types'
import {useStructureTool} from '../../../../useStructureTool'
import {ActionDialogWrapper, ActionMenuListItem} from '../../statusBar/ActionMenuButton'
import {isRestoreAction} from '../../statusBar/DocumentStatusBarActions'
import {TimelineMenu} from '../../timeline'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentHeaderTabs} from './DocumentHeaderTabs'
import {DocumentHeaderTitle} from './DocumentHeaderTitle'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DocumentPanelHeaderProps {
  menuItems: PaneMenuItem[]
}

export const DocumentPanelHeader = memo(
  forwardRef(function DocumentPanelHeader(
    _props: DocumentPanelHeaderProps,
    ref: ForwardedRef<HTMLDivElement>,
  ) {
    const {menuItems} = _props
    const {
      actions: allActions,
      editState,
      onMenuAction,
      onPaneClose,
      onPaneSplit,
      menuItemGroups,
      schemaType,
      timelineStore,
      connectionState,
      views,
      unstable_languageFilter,
    } = useDocumentPane()
    const {features} = useStructureTool()
    const {index, BackLink, hasGroupSiblings} = usePaneRouter()
    const {actions: fieldActions} = useFieldActions()
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null)

    // The restore action has a dedicated place in the UI; it's only visible when the user is
    // viewing a different document revision. It must be omitted from this collection.
    const actions = useMemo(
      () => (allActions ?? []).filter((action) => !isRestoreAction(action)),
      [allActions],
    )

    const menuNodes = useMemo(
      () =>
        resolveMenuNodes({actionHandler: onMenuAction, fieldActions, menuItems, menuItemGroups}),
      [onMenuAction, fieldActions, menuItemGroups, menuItems],
    )

    const menuButtonNodes = useMemo(() => menuNodes.filter(isMenuNodeButton), [menuNodes])
    const contextMenuNodes = useMemo(() => menuNodes.filter(isNotMenuNodeButton), [menuNodes])
    const showTabs = views.length > 1

    // Subscribe to external timeline state changes
    const rev = useTimelineSelector(timelineStore, (state) => state.revTime)

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

    const renderPaneActions = useCallback<
      (props: {states: DocumentActionDescription[]}) => React.ReactNode
    >(
      ({states}) => (
        <DocumentPanelHeaderActionDialogDeferred
          contextMenuNodes={contextMenuNodes}
          setReferenceElement={setReferenceElement}
          referenceElement={referenceElement}
          states={states}
        />
      ),
      [contextMenuNodes, referenceElement],
    )

    return (
      <TooltipDelayGroupProvider>
        <PaneHeader
          border
          ref={ref}
          loading={connectionState === 'connecting' && !editState?.draft && !editState?.published}
          title={<DocumentHeaderTitle />}
          tabs={showTabs && <DocumentHeaderTabs />}
          tabIndex={tabIndex}
          backButton={
            showBackButton && (
              <Button
                as={BackLink}
                data-as="a"
                icon={ArrowLeftIcon}
                mode="bleed"
                tooltipProps={{content: t('pane-header.back-button.text')}}
              />
            )
          }
          subActions={<TimelineMenu chunk={rev} mode="rev" placement="bottom-end" />}
          actions={
            <Flex align="center" gap={1}>
              {unstable_languageFilter.length > 0 && (
                <>
                  {unstable_languageFilter.map((languageFilterComponent, idx) => {
                    return createElement(languageFilterComponent, {
                      // eslint-disable-next-line react/no-array-index-key
                      key: `language-filter-${idx}`,
                      schemaType,
                    })
                  })}
                </>
              )}

              {menuButtonNodes.map((item) => (
                <PaneHeaderActionButton key={item.key} node={item} />
              ))}
              {editState && (
                <RenderActionCollectionState
                  actions={actions}
                  actionProps={editState}
                  group="paneActions"
                >
                  {renderPaneActions}
                </RenderActionCollectionState>
              )}

              {showSplitPaneButton && (
                <Button
                  aria-label={t('buttons.split-pane-button.aria-label')}
                  icon={SplitVerticalIcon}
                  key="split-pane-button"
                  mode="bleed"
                  onClick={onPaneSplit}
                  tooltipProps={{content: t('buttons.split-pane-button.tooltip')}}
                />
              )}

              {showSplitPaneCloseButton && (
                <Button
                  icon={CloseIcon}
                  key="close-view-button"
                  mode="bleed"
                  onClick={onPaneClose}
                  tooltipProps={{content: t('buttons.split-pane-close-button.title')}}
                />
              )}

              {showPaneGroupCloseButton && (
                <Button
                  icon={CloseIcon}
                  key="close-view-button"
                  mode="bleed"
                  tooltipProps={{content: t('buttons.split-pane-close-group-button.title')}}
                  as={BackLink}
                />
              )}
            </Flex>
          }
        />
      </TooltipDelayGroupProvider>
    )
  }),
)

const DocumentPanelHeaderActionDialogDeferred = memo(
  function DocumentPanelHeaderActionDialogDeferred(props: {
    states: DocumentActionDescription[]
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
        setReferenceElement={setReferenceElement}
        referenceElement={referenceElement}
        contextMenuNodes={contextMenuNodes}
        states={states}
      />
    )
  },
)

const DocumentPanelHeaderActionDialog = memo(function DocumentPanelHeaderActionDialog(props: {
  states: DocumentActionDescription[]
  setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>
  referenceElement: HTMLElement | null
  contextMenuNodes: _PaneMenuNode[]
}) {
  const {states, setReferenceElement, contextMenuNodes, referenceElement} = props

  const renderActionDialog = useCallback<
    ({handleAction}: {handleAction: (idx: number) => void}) => React.ReactNode
  >(
    ({handleAction}) => (
      <div ref={setReferenceElement}>
        <PaneContextMenuButton
          nodes={contextMenuNodes}
          key="context-menu"
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

  return (
    <ActionDialogWrapper actionStates={states} referenceElement={referenceElement}>
      {renderActionDialog}
    </ActionDialogWrapper>
  )
})
