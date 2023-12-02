import {
  useElementRect,
  DialogProvider,
  Flex,
  PortalProvider,
  DialogProviderProps,
  TooltipDelayGroupProvider,
} from '@sanity/ui'
import {useState, useCallback, useMemo} from 'react'
import {useTranslation} from 'react-i18next'
import {Path} from 'sanity-diff-patch'
import styled from 'styled-components'
import isHotkey from 'is-hotkey'
import {usePaneLayout, Pane, PaneFooter} from '../../../components'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../../constants'
import {structureLocaleNamespace} from '../../../i18n'
import {useDeskTool} from '../../../useDeskTool'
import {DocumentOperationResults} from '../DocumentOperationResults'
import {
  DOCUMENT_PANEL_INITIAL_MIN_WIDTH,
  DOCUMENT_INSPECTOR_MIN_WIDTH,
  DOCUMENT_PANEL_MIN_WIDTH,
} from '../constants'
import {DocumentPanel} from '../documentPanel'
import {DocumentActionShortcuts} from '../keyboardShortcuts'
import {DocumentStatusBar} from '../statusBar'
import {useDocumentPane} from '../useDocumentPane'
import {DocumentPanelHeader} from '../documentPanel/header'
import {DocumentInspectorMenuItemsResolver} from '../DocumentInspectorMenuItemsResolver'
import {usePreviewUrl} from '../usePreviewUrl'
import {TOOLTIP_DELAY_PROPS} from '../../../../ui/tooltip/constants'
import {getMenuItems} from '../menuItems'
import {DocumentLayoutError} from './DocumentLayoutError'
import {
  useZIndex,
  ChangeConnectorRoot,
  DocumentInspectorMenuItem,
  FieldActionsResolver,
  DocumentFieldActionNode,
  FieldActionsProvider,
} from 'sanity'

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
    documentId,
    documentType,
    fieldActions,
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
  } = useDocumentPane()

  const {features} = useDeskTool()
  const {t} = useTranslation(structureLocaleNamespace)
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const zOffsets = useZIndex()
  const previewUrl = usePreviewUrl(value)

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [headerElement, setHeaderElement] = useState<HTMLDivElement | null>(null)

  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const [documentPanelPortalElement, setDocumentPanelPortalElement] = useState<HTMLElement | null>(
    null,
  )

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
        t,
      }),
    [currentInspector, features, hasValue, inspectorMenuItems, inspectors, previewUrl, t],
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
    <>
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

          <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
            <Flex direction="column" flex={1} height={layoutCollapsed ? undefined : 'fill'}>
              <StyledChangeConnectorRoot
                data-testid="change-connector-root"
                isReviewChangesOpen={changesOpen}
                onOpenReviewChanges={onHistoryOpen}
                onSetFocus={onConnectorSetFocus}
              >
                <DocumentPanel
                  footerHeight={footerHeight || null}
                  headerHeight={headerHeight || null}
                  isInspectOpen={inspectOpen}
                  rootElement={rootElement}
                  setDocumentPanelPortalElement={setDocumentPanelPortalElement}
                />
              </StyledChangeConnectorRoot>
            </Flex>
          </DialogProvider>

          {/* These providers are added because we want the dialogs in `DocumentStatusBar` to be scoped to the document pane. */}
          {/* The portal element comes from `DocumentPanel`. */}
          <PortalProvider
            __unstable_elements={{[DOCUMENT_PANEL_PORTAL_ELEMENT]: documentPanelPortalElement}}
          >
            <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
              <PaneFooter ref={setFooterElement}>
                <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
                  <DocumentStatusBar actionsBoxRef={setActionsBoxElement} />
                </TooltipDelayGroupProvider>
              </PaneFooter>
            </DialogProvider>
          </PortalProvider>
          <DocumentOperationResults />
        </DocumentActionShortcuts>
      </FieldActionsProvider>
    </>
  )
}
