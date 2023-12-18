import {
  Card,
  Code,
  DialogProvider,
  DialogProviderProps,
  Flex,
  PortalProvider,
  Stack,
  Text,
  TooltipDelayGroupProvider,
  useElementRect,
} from '@sanity/ui'
import React, {memo, useCallback, useMemo, useState} from 'react'
import styled from 'styled-components'
import {fromString as pathFromString} from '@sanity/util/paths'
import {Path} from '@sanity/types'
import {DocumentPaneNode} from '../../types'
import {Pane, PaneFooter, usePaneRouter} from '../../components'
import {usePaneLayout} from '../../components/pane/usePaneLayout'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {DOCUMENT_PANEL_PORTAL_ELEMENT} from '../../constants'
import {CommentsEnabledProvider} from '../../comments'
import {structureLocaleNamespace} from '../../i18n'
import {DocumentOperationResults} from './DocumentOperationResults'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {DocumentPanel} from './documentPanel'
import {DocumentActionShortcuts} from './keyboardShortcuts'
import {DocumentStatusBar} from './statusBar'
import {DocumentPaneProviderProps} from './types'
import {useDocumentPane} from './useDocumentPane'
import {
  DOCUMENT_INSPECTOR_MIN_WIDTH,
  DOCUMENT_PANEL_INITIAL_MIN_WIDTH,
  DOCUMENT_PANEL_MIN_WIDTH,
} from './constants'
import {
  ChangeConnectorRoot,
  ReferenceInputOptionsProvider,
  SourceProvider,
  isDev,
  Translate,
  useDocumentType,
  useSource,
  useTemplatePermissions,
  useTemplates,
  useTranslation,
  useZIndex,
} from 'sanity'
import {TOOLTIP_DELAY_PROPS} from 'sanity/_internal-ui-components'

type DocumentPaneOptions = DocumentPaneNode['options']

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
/**
 * @internal
 */
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
  const {resolveNewDocumentOptions} = useSource().document
  const paneRouter = usePaneRouter()
  const options = usePaneOptions(pane.options, paneRouter.params)
  const {documentType, isLoaded: isDocumentLoaded} = useDocumentType(options.id, options.type)

  // The templates that should be creatable from inside this document pane.
  // For example, from the "Create new" menu in reference inputs.
  const templateItems = useMemo(() => {
    return resolveNewDocumentOptions({
      type: 'document',
      documentId: options.id,
      schemaType: options.type,
    })
  }, [options.id, options.type, resolveNewDocumentOptions])

  const [templatePermissions, isTemplatePermissionsLoading] = useTemplatePermissions({
    templateItems,
  })
  const isLoaded = isDocumentLoaded && !isTemplatePermissionsLoading

  const providerProps = useMemo(() => {
    return isLoaded && documentType && options.type !== documentType
      ? mergeDocumentType(props, options, documentType)
      : props
  }, [props, documentType, isLoaded, options])

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

  const {t} = useTranslation(structureLocaleNamespace)

  if (options.type === '*' && !isLoaded) {
    return (
      <LoadingPane
        flex={2.5}
        minWidth={320}
        paneKey={paneKey}
        title={t('panes.document-pane.document-not-found.loading')}
      />
    )
  }

  if (!documentType) {
    return (
      <ErrorPane
        flex={2.5}
        minWidth={320}
        paneKey={paneKey}
        title={t('panes.document-pane.document-not-found.title')}
      >
        <Stack space={4}>
          <Text as="p">
            <Translate
              t={t}
              i18nKey="panes.document-pane.document-not-found.text"
              values={{id: options.id}}
            />
          </Text>
        </Stack>
      </ErrorPane>
    )
  }

  return (
    <CommentsEnabledProvider documentId={options.id} documentType={options.type}>
      <DocumentPaneProvider
        // this needs to be here to avoid formState from being re-used across (incompatible) document types
        // see https://github.com/sanity-io/sanity/discussions/3794 for a description of the problem
        key={`${documentType}-${options.id}`}
        {...providerProps}
      >
        {/* NOTE: this is a temporary location for this provider until we */}
        {/* stabilize the reference input options formally in the form builder */}
        {/* eslint-disable-next-line react/jsx-pascal-case */}
        <ReferenceInputOptionsProvider
          EditReferenceLinkComponent={ReferenceChildLink}
          onEditReference={handleEditReference}
          initialValueTemplateItems={templatePermissions}
          activePath={activePath}
        >
          <InnerDocumentPane />
        </ReferenceInputOptionsProvider>
      </DocumentPaneProvider>
    </CommentsEnabledProvider>
  )
}

function usePaneOptions(
  options: DocumentPaneOptions,
  params: Record<string, string | undefined> = {},
): DocumentPaneOptions {
  const templates = useTemplates()

  return useMemo(() => {
    // The document type is provided, so return
    if (options.type && options.type !== '*') {
      return options
    }

    // Attempt to derive document type from the template configuration
    const templateName = options.template || params.template
    const template = templateName ? templates.find((t) => t.id === templateName) : undefined
    const documentType = template?.schemaType

    // No document type was found in a template
    if (!documentType) {
      return options
    }

    // The template provided the document type, so modify the pane’s `options` property
    return {...options, type: documentType}
  }, [options, params.template, templates])
}

function mergeDocumentType(
  props: DocumentPaneProviderProps,
  options: DocumentPaneOptions,
  documentType: string,
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
    documentType,
    inspector,
    inspectOpen,
    onFocus,
    onPathOpen,
    onHistoryOpen,
    onKeyUp,
    paneKey,
    schemaType,
    value,
  } = useDocumentPane()
  const {collapsed: layoutCollapsed} = usePaneLayout()
  const zOffsets = useZIndex()
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [footerElement, setFooterElement] = useState<HTMLDivElement | null>(null)
  const [actionsBoxElement, setActionsBoxElement] = useState<HTMLDivElement | null>(null)
  const [documentPanelPortalElement, setDocumentPanelPortalElement] = useState<HTMLElement | null>(
    null,
  )
  const footerRect = useElementRect(footerElement)
  const footerH = footerRect?.height

  const onConnectorSetFocus = useCallback(
    (path: Path) => {
      onPathOpen(path)
      onFocus(path)
    },
    [onPathOpen, onFocus],
  )

  const currentMinWidth =
    DOCUMENT_PANEL_INITIAL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)

  const minWidth = DOCUMENT_PANEL_MIN_WIDTH + (inspector ? DOCUMENT_INSPECTOR_MIN_WIDTH : 0)
  const {t} = useTranslation(structureLocaleNamespace)

  if (!schemaType) {
    return (
      <ErrorPane
        currentMinWidth={currentMinWidth}
        flex={2.5}
        minWidth={minWidth}
        paneKey={paneKey}
        title={
          <Translate
            t={t}
            i18nKey="panes.document-pane.document-unknown-type.title"
            values={{documentType}}
          />
        }
        tone="caution"
      >
        <Stack space={4}>
          {documentType && (
            <Text as="p">
              <Translate
                t={t}
                i18nKey="panes.document-pane.document-unknown-type.text"
                values={{documentType}}
              />
            </Text>
          )}

          {!documentType && (
            <Text as="p">{t('panes.document-pane.document-unknown-type.without-schema.text')}</Text>
          )}

          {isDev && value && (
            /* eslint-disable i18next/no-literal-string */
            <>
              <Text as="p">Here is the JSON representation of the document:</Text>
              <Card padding={3} overflow="auto" radius={2} shadow={1} tone="inherit">
                <Code language="json" size={[1, 1, 2]}>
                  {JSON.stringify(value, null, 2)}
                </Code>
              </Card>
            </>
            /* eslint-enable i18next/no-literal-string */
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
            <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
              <DocumentStatusBar actionsBoxRef={setActionsBoxElement} />
            </TooltipDelayGroupProvider>
          </PaneFooter>
        </DialogProvider>
      </PortalProvider>

      <DocumentOperationResults />
    </DocumentActionShortcuts>
  )
}
