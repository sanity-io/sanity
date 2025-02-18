import {DialogProvider, type DialogProviderProps, Flex, useElementRect} from '@sanity/ui'
import {isHotkey} from 'is-hotkey-esm'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import {
  ChangeConnectorRoot,
  type DocumentFieldActionNode,
  type DocumentInspectorMenuItem,
  FieldActionsProvider,
  FieldActionsResolver,
  GetFormValueProvider,
  type Path,
  useGlobalCopyPasteElementHandler,
  useZIndex,
} from 'sanity'
import {styled} from 'styled-components'

import {Pane, usePaneLayout, usePaneRouter} from '../../../components'
import {useDocumentIdStack} from '../../../hooks/useDocumentIdStack'
import {structureLocaleNamespace} from '../../../i18n'
import {useStructureTool} from '../../../useStructureTool'
import {
  DOCUMENT_INSPECTOR_MIN_WIDTH,
  DOCUMENT_PANEL_INITIAL_MIN_WIDTH,
  DOCUMENT_PANEL_MIN_WIDTH,
} from '../constants'
import {DocumentInspectorMenuItemsResolver} from '../DocumentInspectorMenuItemsResolver'
import {DocumentOperationResults} from '../DocumentOperationResults'
import {DocumentPanel} from '../documentPanel'
import {DocumentPanelHeader} from '../documentPanel/header'
import {DocumentActionShortcuts} from '../keyboardShortcuts'
import {getMenuItems} from '../menuItems'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentLayoutError} from './DocumentLayoutError'
import {DocumentLayoutFooter} from './DocumentLayoutFooter'

const EMPTY_ARRAY: [] = []

const DIALOG_PROVIDER_POSITION: DialogProviderProps['position'] = [
  // We use the `position: fixed` for dialogs on narrower screens (first two media breakpoints).
  'fixed',
  'fixed',
  // And we use the `position: absolute` strategy (within panes) on wide screens.
  'absolute',
]

const StyledChangeConnectorRoot = styled(ChangeConnectorRoot)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
`

export function DocumentLayout() {
  const {
    changesOpen,
    displayed,
    documentId,
    documentType,
    editState,
    fieldActions,
    focusPath,
    inspectOpen,
    inspector,
    inspectors,
    onFocus,
    onHistoryOpen,
    onMenuAction,
    onPathOpen,
    paneKey,
    schemaType,
    value,
    isInitialValueLoading,
    ready,
    previewUrl,
  } = useDocumentPane()
  const {params: paneParams} = usePaneRouter()
  const {features} = useStructureTool()
  const {t} = useTranslation(structureLocaleNamespace)
  const {collapsed: layoutCollapsed} = usePaneLayout()

  const zOffsets = useZIndex()

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)

  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const [documentPanelPortalElement, setDocumentPanelPortalElement] = useState<HTMLElement | null>(
    null,
  )

  useGlobalCopyPasteElementHandler({
    element: rootElement,
    focusPath,
    value,
  })

  const [inspectorMenuItems, setInspectorMenuItems] = useState<DocumentInspectorMenuItem[]>([])
  const [rootFieldActionNodes, setRootFieldActionNodes] = useState<DocumentFieldActionNode[]>([])

  const footerRect = useElementRect(footerElement)
  const headerRect = useElementRect(headerElement)
  const footerHeight = footerRect?.height
  const headerHeight = headerRect?.height
  const currentMinWidth =
    DOCUMENT_PANEL_INITIAL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)
  const minWidth = DOCUMENT_PANEL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)

  const currentInspector = useMemo(
    () => inspectors?.find((i) => i.name === inspector?.name),
    [inspectors, inspector?.name],
  )

  const documentIdStack = useDocumentIdStack({displayed, documentId, editState})

  const hasValue = Boolean(value)

  const menuItems = useMemo(
    () =>
      getMenuItems({
        currentInspector,
        features,
        hasValue,
        inspectorMenuItems,
        inspectors,
        previewUrl,
        documentIdStack,
        t,
      }),
    [
      currentInspector,
      documentIdStack,
      features,
      hasValue,
      inspectorMenuItems,
      inspectors,
      previewUrl,
      t,
    ],
  )

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      for (const item of menuItems) {
        if (item.shortcut) {
          if (isHotkey(item.shortcut, event)) {
            event.preventDefault()
            event.stopPropagation()
            onMenuAction(item)
            return
          }
        }
      }
    },
    [onMenuAction, menuItems],
  )

  const onConnectorSetFocus = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onPathOpen, onFocus],
  )

  if (!schemaType) {
    return (
      <DocumentLayoutError
        currentMinWidth={currentMinWidth}
        documentType={documentType}
        minWidth={minWidth}
        paneKey={paneKey}
        value={value}
      />
    )
  }

  return (
    <GetFormValueProvider value={value}>
      {inspectors.length > 0 && (
        <DocumentInspectorMenuItemsResolver
          documentId={documentId}
          documentType={documentType}
          inspectors={inspectors}
          onMenuItems={setInspectorMenuItems}
        />
      )}

      {fieldActions.length > 0 && schemaType && (
        <FieldActionsResolver
          actions={fieldActions}
          documentId={documentId}
          documentType={documentType}
          onActions={setRootFieldActionNodes}
          path={EMPTY_ARRAY}
          schemaType={schemaType}
        />
      )}

      <FieldActionsProvider actions={rootFieldActionNodes} path={EMPTY_ARRAY}>
        <DocumentActionShortcuts
          actionsBoxElement={actionsBoxElement}
          as={Pane}
          currentMinWidth={currentMinWidth}
          data-testid="document-pane"
          flex={2.5}
          id={paneKey}
          minWidth={minWidth}
          onKeyUp={handleKeyUp}
          rootRef={setRootElement}
        >
          <DocumentPanelHeader ref={setHeaderElement} menuItems={menuItems} />
          <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.paneDialog}>
            <Flex direction="column" flex={1} height={layoutCollapsed ? undefined : 'fill'}>
              <StyledChangeConnectorRoot
                data-testid="change-connector-root"
                isReviewChangesOpen={changesOpen && paneParams?.changesInspectorTab === 'review'}
                onOpenReviewChanges={onHistoryOpen}
                onSetFocus={onConnectorSetFocus}
              >
                <DocumentPanel
                  footerHeight={footerHeight || null}
                  headerHeight={headerHeight || null}
                  isInspectOpen={inspectOpen}
                  rootElement={rootElement}
                  setDocumentPanelPortalElement={setDocumentPanelPortalElement}
                  footer={
                    <DocumentLayoutFooter
                      documentPanelPortalElement={documentPanelPortalElement}
                      setFooterElement={setFooterElement}
                      setActionsBoxElement={setActionsBoxElement}
                    />
                  }
                />
              </StyledChangeConnectorRoot>
            </Flex>
          </DialogProvider>
          <DocumentOperationResults />
        </DocumentActionShortcuts>
      </FieldActionsProvider>
    </GetFormValueProvider>
  )
}
