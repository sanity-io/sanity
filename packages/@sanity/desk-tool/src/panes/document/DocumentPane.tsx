import {useDocumentType} from '@sanity/base/hooks'
import {LegacyLayerProvider, useZIndex} from '@sanity/base/components'
import {ChangeConnectorRoot} from '@sanity/base/change-indicators'
import {getTemplateById} from '@sanity/base/initial-value-templates'
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
import {DocumentPaneNode} from '../../types'
import {useDeskTool} from '../../contexts/deskTool'
import {usePaneRouter} from '../../contexts/paneRouter'
import {PaneFooter} from '../../components/pane'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {ChangesPanel} from './changesPanel'
import {DocumentPanel} from './documentPanel'
import {DocumentOperationResults} from './DocumentOperationResults'
import {InspectDialog} from './inspectDialog'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {useDocumentPane} from './useDocumentPane'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {DocumentPaneProviderProps} from './types'

declare const __DEV__: boolean

type DocumentPaneOptions = DocumentPaneNode['options']

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
  const paneRouter = usePaneRouter()
  const options = usePaneOptions(props.pane.options, paneRouter.params)
  const {documentType, isLoaded} = useDocumentType(options.id, options.type)
  const providerProps = useMemo(() => {
    return isLoaded && documentType && options.type !== documentType
      ? mergeDocumentType(props, options, documentType)
      : props
  }, [props, documentType, isLoaded, options])

  if (options.type === '*' && !isLoaded) {
    return <LoadingPane flex={2.5} minWidth={320} title="Loading document…" />
  }

  if (!documentType) {
    return (
      <ErrorPane flex={2.5} minWidth={320} title={<>The document was not found</>}>
        <Stack space={4}>
          <Text as="p">
            The document type is not defined, and a document with the <code>{options.id}</code>{' '}
            identifier could not be found.
          </Text>
        </Stack>
      </ErrorPane>
    )
  }

  return (
    <DocumentPaneProvider {...providerProps}>
      <InnerDocumentPane />
    </DocumentPaneProvider>
  )
})

function usePaneOptions(
  options: DocumentPaneOptions,
  params: Record<string, string | undefined> = {}
): DocumentPaneOptions {
  return useMemo(() => {
    // The document type is provided, so return
    if (options.type && options.type !== '*') {
      return options
    }

    // Attempt to derive document type from the template configuration
    const templateName = options.template || params.template
    const template = templateName ? getTemplateById(templateName) : undefined
    const documentType = template?.schemaType

    // No document type was found in a template
    if (!documentType) {
      return options
    }

    // The template provided the document type, so modify the pane’s `options` property
    return {...options, type: documentType}
  }, [options, params.template])
}

function mergeDocumentType(
  props: DocumentPaneProviderProps,
  options: DocumentPaneOptions,
  documentType: string
): DocumentPaneProviderProps {
  return {
    ...props,
    pane: {
      ...props.pane,
      options: {...options, type: documentType},
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
