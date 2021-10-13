import {LegacyLayerProvider, useZIndex} from '@sanity/base/components'
import {ChangeConnectorRoot} from '@sanity/base/change-indicators'
import {
  BoundaryElementProvider,
  Card,
  Code,
  DialogProvider,
  DialogProviderProps,
  Flex,
  Stack,
  Text,
  useElementRect,
} from '@sanity/ui'
import React, {memo, useMemo, useState} from 'react'
import styled from 'styled-components'
import {useDeskTool} from '../../contexts/deskTool'
import {PaneFooter} from '../../components/pane'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {useDocumentType} from '../../lib/resolveDocumentType'
import {ErrorPane} from '../error'
import {ChangesPanel} from './changesPanel'
import {DocumentPanel} from './documentPanel'
import {DocumentOperationResults} from './DocumentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {useDocumentPane} from './useDocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {DocumentPaneProviderProps} from './types'

const DIALOG_PROVIDER_POSITION: DialogProviderProps['position'] = [
  // We use the `position: fixed` for dialogs on narrow screens (< 512px).
  'fixed',
  // And we use the `position: absolute` strategy (within panes) on wide screens.
  'absolute',
]

const StyledChangeConnectorRoot = styled(ChangeConnectorRoot)`
  flex: 2;
  display: flex;
  direction: column;
  min-width: 0;
  height: 100%;
`

export const DocumentPane = memo(function DocumentPane(props: DocumentPaneProviderProps) {
  const {id, type} = props.pane.options
  const {documentType, isLoaded} = useDocumentType(id, type)
  const providerProps = React.useMemo(
    () =>
      isLoaded && documentType && props.pane.options.type !== documentType
        ? mergeDocumentType(props, documentType)
        : props,
    [props, documentType, isLoaded]
  )

  if (type === '*' && !isLoaded) {
    return null
  }

  if (!documentType) {
    return <div>Error: Document type not defined, and document does not exist</div>
  }

  return (
    <DocumentPaneProvider {...providerProps}>
      <InnerDocumentPane />
    </DocumentPaneProvider>
  )
})

function mergeDocumentType(
  props: DocumentPaneProviderProps,
  documentType: string
): DocumentPaneProviderProps {
  return {
    ...props,
    pane: {
      ...props.pane,
      options: {...props.pane.options, type: documentType},
    },
  }
}

function InnerDocumentPane() {
  const {
    changesOpen,
    displayed,
    documentSchema,
    documentType,
    handleFocus,
    handleHistoryOpen,
    handleKeyUp,
    initialValue,
    inspectOpen,
    value,
  } = useDocumentPane()
  const {features} = useDeskTool()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const zOffsets = useZIndex()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const footerRect = useElementRect(footerElement)
  const footerH = footerRect?.height

  const documentPanel = useMemo(
    () => <DocumentPanel footerHeight={footerH || null} rootElement={rootElement} />,
    [footerH, rootElement]
  )

  const footer = useMemo(
    () => (
      <PaneFooter ref={setFooterElement}>
        <DocumentStatusBar actionsBoxRef={setActionsBoxElement} />
      </PaneFooter>
    ),
    []
  )

  const inspectDialog = useMemo(
    () => (
      <LegacyLayerProvider zOffset="fullscreen">
        {inspectOpen && <InspectDialog value={displayed || initialValue.value} />}
      </LegacyLayerProvider>
    ),
    [displayed, initialValue.value, inspectOpen]
  )

  const changesPanel = useMemo(() => {
    if (!features.reviewChanges) return null
    if (!changesOpen) return null

    return (
      <BoundaryElementProvider element={rootElement}>
        <ChangesPanel />
      </BoundaryElementProvider>
    )
  }, [changesOpen, features.reviewChanges, rootElement])

  const children = useMemo(() => {
    if (!documentSchema) {
      return (
        <ErrorPane
          flex={2.5}
          minWidth={320}
          title={
            <>
              Unknown document type: <code>{documentType}</code>
            </>
          }
          tone="caution"
        >
          <Stack space={4}>
            {documentType && (
              <Text as="p">
                This document has the schema type <code>{documentType}</code>, which is not defined
                as a type in the local content studio schema.
              </Text>
            )}

            {!documentType && (
              <Text as="p">
                This document does not exist, and no schema type was specified for it.
              </Text>
            )}

            {__DEV__ && value && (
              <>
                <Text as="p">Here is the JSON representation of the document:</Text>
                <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
                  <Code language="json" size={[1, 1, 2]}>
                    {JSON.stringify(value, null, 2)}
                  </Code>
                </Card>
              </>
            )}
          </Stack>
        </ErrorPane>
      )
    }

    if (initialValue.error) {
      return (
        <ErrorPane flex={2.5} minWidth={320} title="Failed to resolve initial value">
          <Text as="p">Check developer console for details.</Text>
        </ErrorPane>
      )
    }

    return (
      <>
        <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
          <Flex flex={1} height={layoutCollapsed ? undefined : 'fill'}>
            <StyledChangeConnectorRoot
              isReviewChangesOpen={changesOpen}
              onOpenReviewChanges={handleHistoryOpen}
              onSetFocus={handleFocus}
            >
              {documentPanel}
              {changesPanel}
            </StyledChangeConnectorRoot>
          </Flex>
        </DialogProvider>
        {footer}
        <DocumentOperationResults />
        {inspectDialog}
      </>
    )
  }, [
    changesOpen,
    changesPanel,
    documentPanel,
    documentSchema,
    documentType,
    footer,
    handleFocus,
    handleHistoryOpen,
    initialValue.error,
    inspectDialog,
    layoutCollapsed,
    value,
    zOffsets.portal,
  ])

  return (
    <DocumentActionShortcuts
      actionsBoxElement={actionsBoxElement}
      data-testid="document-pane"
      flex={2.5}
      minWidth={changesOpen ? 640 : 320}
      onKeyUp={handleKeyUp}
      rootRef={setRootElement}
    >
      {children}
    </DocumentActionShortcuts>
  )
}
