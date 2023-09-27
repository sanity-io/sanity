import {
  Card,
  Code,
  DialogProvider,
  DialogProviderProps,
  ErrorBoundary,
  ErrorBoundaryProps,
  Flex,
  PortalProvider,
  Stack,
  Text,
  useElementRect,
  useToast,
} from '@sanity/ui'
import React, {memo, useCallback, useEffect, useMemo, useState} from 'react'
import styled from 'styled-components'
import {fromString as pathFromString} from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {Pane, PaneFooter, usePaneRouter} from '../../components'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../constants'
import {DocumentOperationResults} from './DocumentOperationResults'
import {DocumentPaneProvider, DocumentPaneProviderProps} from './DocumentPaneProvider'
import {DocumentPanel} from './documentPanel'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {useDocumentPane} from './useDocumentPane'
import {
  DOCUMENT_INSPECTOR_MIN_WIDTH,
  DOCUMENT_PANEL_INITIAL_MIN_WIDTH,
  DOCUMENT_PANEL_MIN_WIDTH,
  HISTORY_INSPECTOR_NAME,
} from './constants'
import {TimelineErrorPane} from './timeline'
import {DocumentProvider, useDocumentType, useFormState} from 'sanity/document'
import {
  ChangeConnectorRoot,
  SourceProvider,
  TimelineError,
  getPublishedId,
  isDev,
  useConnectionState,
  useSource,
  useZIndex,
} from 'sanity'

type ErrorParams = Parameters<ErrorBoundaryProps['onCatch']>[0]

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

export const DocumentPane = memo(function DocumentPane(props: DocumentPaneProviderProps) {
  const {name: parentSourceName} = useSource()

  return (
    <SourceProvider name={props.pane.source || parentSourceName}>
      <DocumentPaneInner {...props} />
    </SourceProvider>
  )
})

function DocumentPaneInner(props: DocumentPaneProviderProps) {
  const {pane, paneKey} = props
  const paneRouter = usePaneRouter()
  const [errorParams, setErrorParams] = useState<ErrorParams | null>(null)

  const {ReferenceChildLink, handleEditReference, groupIndex, routerPanesState} = paneRouter
  const childParams = routerPanesState[groupIndex + 1]?.[0].params || {}
  const routerPanesStateLength = routerPanesState.length
  const {parentRefPath} = childParams

  const activePath: {path: Path; state: 'selected' | 'pressed' | 'none'} = useMemo(() => {
    return parentRefPath
      ? {
          path: pathFromString(parentRefPath),
          state:
            // eslint-disable-next-line no-nested-ternary
            groupIndex >= routerPanesStateLength - 1
              ? 'none'
              : groupIndex >= routerPanesStateLength - 2
              ? 'selected'
              : 'pressed',
        }
      : {path: [], state: 'none'}
  }, [parentRefPath, groupIndex, routerPanesStateLength])

  const templateNameFromUrl = paneRouter.params?.template
  const templateNameFromStructure = pane.options.template

  if (
    templateNameFromUrl &&
    templateNameFromStructure &&
    templateNameFromUrl !== templateNameFromStructure
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      `Conflicting templates: URL says "${templateNameFromUrl}", structure node says "${templateNameFromStructure}". Using "${templateNameFromStructure}".`,
    )
  }
  const templateName = templateNameFromStructure || templateNameFromUrl

  const templateParams = {
    ...pane.options.templateParameters,
    ...(typeof paneRouter.payload === 'object' ? paneRouter.payload || {} : {}),
  }

  const handleTimelineRangeChange = useCallback(
    (range: {since?: string; rev?: string}) => {
      paneRouter.setParams({
        ...paneRouter.params,
        since: range.since,
        rev: range.rev,
      })
    },
    [paneRouter],
  )

  const connectionState = useConnectionState(getPublishedId(pane.options.id))
  const toast = useToast()

  // reset the error if the ID changes
  useEffect(() => {
    setErrorParams(null)
  }, [pane.options.id])

  useEffect(() => {
    if (connectionState === 'reconnecting') {
      toast.push({
        id: 'sanity/desk/reconnecting',
        status: 'warning',
        title: <>Connection lost. Reconnecting…</>,
      })
    }
  }, [connectionState, toast])

  if (errorParams?.error instanceof TimelineError) {
    // not using a `useCallback` here because this handler won't always be needed
    const handleRetry = () => {
      const nextParams = {...paneRouter.params}
      delete nextParams.since
      delete nextParams.rev
      paneRouter.setParams(nextParams)

      setErrorParams(null)
    }

    return (
      <TimelineErrorPane
        flex={2.5}
        minWidth={320}
        paneKey={paneKey}
        // eslint-disable-next-line react/jsx-no-bind
        onRetry={handleRetry}
      />
    )
  }

  return (
    <ErrorBoundary onCatch={setErrorParams}>
      <DocumentProvider
        documentId={pane.options.id}
        documentType={pane.options.type}
        templateName={templateName}
        templateParams={templateParams}
        timelineRange={{
          rev: paneRouter.params?.rev,
          since: paneRouter.params?.since,
        }}
        onTimelineRangeChange={handleTimelineRangeChange}
        initialFocusPath={
          paneRouter.params?.path ? pathFromString(paneRouter.params.path) : undefined
        }
        isHistoryInspectorOpen={paneRouter.params?.inspect === HISTORY_INSPECTOR_NAME}
        EditReferenceLinkComponent={ReferenceChildLink}
        onEditReference={handleEditReference}
        activePath={activePath}
        fallback={
          <LoadingPane flex={2.5} minWidth={320} paneKey={paneKey} title="Loading document…" />
        }
      >
        <DocumentPaneProvider
          // this needs to be here to avoid formState from being re-used across (incompatible) document types
          // see https://github.com/sanity-io/sanity/discussions/3794 for a description of the problem
          key={`${pane.options.type}-${pane.options.id}`}
          {...props}
        >
          <InnerDocumentPane />
        </DocumentPaneProvider>
      </DocumentProvider>
    </ErrorBoundary>
  )
}

function InnerDocumentPane() {
  const documentType = useDocumentType()
  const {changesOpen, inspector, inspectOpen, onHistoryOpen, onKeyUp, paneKey} = useDocumentPane()
  const {setOpenPath, setFocusPath, schemaType, value, ready} = useFormState()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const paneRouter = usePaneRouter()
  const zOffsets = useZIndex()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const [documentPanelPortalElement, setDocumentPanelPortalElement] = useState<HTMLElement | null>(
    null,
  )
  const footerRect = useElementRect(footerElement)
  const footerH = footerRect?.height

  // Reset `focusPath` when `documentId` or `params.path` changes
  useEffect(() => {
    if (ready && paneRouter.params?.path) {
      const nextParams = {...paneRouter.params}
      delete nextParams.path
      paneRouter.setParams(nextParams)
    }
  }, [paneRouter, ready])

  const onConnectorSetFocus = useCallback(
    (path: Path) => {
      setOpenPath(path)
      setFocusPath(path)
    },
    [setFocusPath, setOpenPath],
  )

  const currentMinWidth =
    DOCUMENT_PANEL_INITIAL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)

  const minWidth = DOCUMENT_PANEL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)

  if (!schemaType) {
    return (
      <ErrorPane
        currentMinWidth={currentMinWidth}
        flex={2.5}
        minWidth={minWidth}
        paneKey={paneKey}
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
              This document has the schema type <code>{documentType}</code>, which is not defined as
              a type in the local content studio schema.
            </Text>
          )}

          {!documentType && (
            <Text as="p">
              This document does not exist, and no schema type was specified for it.
            </Text>
          )}

          {isDev && value && (
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

  return (
    <DocumentActionShortcuts
      actionsBoxElement={actionsBoxElement}
      as={Pane}
      currentMinWidth={currentMinWidth}
      data-testid="document-pane"
      flex={2.5}
      id={paneKey}
      minWidth={minWidth}
      onKeyUp={onKeyUp}
      rootRef={setRootElement}
    >
      <DialogProvider position={DIALOG_PROVIDER_POSITION} zOffset={zOffsets.portal}>
        <Flex direction="column" flex={1} height={layoutCollapsed ? undefined : 'fill'}>
          <StyledChangeConnectorRoot
            data-testid="change-connector-root"
            isReviewChangesOpen={changesOpen}
            onOpenReviewChanges={onHistoryOpen}
            onSetFocus={onConnectorSetFocus}
          >
            <DocumentPanel
              footerHeight={footerH || null}
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
            <DocumentStatusBar actionsBoxRef={setActionsBoxElement} />
          </PaneFooter>
        </DialogProvider>
      </PortalProvider>

      <DocumentOperationResults />
    </DocumentActionShortcuts>
  )
}
