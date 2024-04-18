import {type Path} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {memo, useCallback, useLayoutEffect, useMemo, useRef} from 'react'
import {
  COMMENTS_INSPECTOR_NAME,
  CommentsProvider,
  ReferenceInputOptionsProvider,
  SourceProvider,
  Translate,
  useDocumentType,
  useSource,
  useTemplatePermissions,
  useTemplates,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../components'
import {structureLocaleNamespace} from '../../i18n'
import {type DocumentPaneNode} from '../../types'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {useDocumentLayoutComponent} from './document-layout'
import {DocumentPaneProvider} from './DocumentPaneProvider'
import {type DocumentPaneProviderProps} from './types'
import {useDocumentPane} from './useDocumentPane'

type DocumentPaneOptions = DocumentPaneNode['options']

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

  const DocumentLayout = useDocumentLayoutComponent()

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
        <CommentsProviderWrapper>
          <DocumentLayout documentId={options.id} documentType={options.type} />
        </CommentsProviderWrapper>
      </ReferenceInputOptionsProvider>
    </DocumentPaneProvider>
  )
}

function CommentsProviderWrapper({children}: {children: React.ReactNode}) {
  const {documentId, documentType, connectionState, onPathOpen, inspector, openInspector} =
    useDocumentPane()
  const {params, setParams, createPathWithParams} = usePaneRouter()

  const selectedCommentId = params?.comment
  const paramsRef = useRef(params)
  useLayoutEffect(() => {
    paramsRef.current = params
  }, [params])

  const getCommentLink = useCallback(
    (commentId: string) => {
      // Generate a path based on the current pane params.
      // We force a value for `inspect` to ensure that this is included in URLs when comments
      // are created outside of the inspector context (i.e. directly on the field)
      // @todo: consider filtering pane router params and culling all non-active RHS panes prior to generating this link
      const path = createPathWithParams({
        ...paramsRef.current,
        comment: commentId,
        inspect: COMMENTS_INSPECTOR_NAME,
      })
      return `${window.location.origin}${path}`
    },
    [createPathWithParams],
  )

  const handleClearSelectedComment = useCallback(() => {
    setParams({...paramsRef.current, comment: undefined})
  }, [setParams])

  const handleOpenCommentsInspector = useCallback(() => {
    if (inspector?.name === COMMENTS_INSPECTOR_NAME) return

    openInspector(COMMENTS_INSPECTOR_NAME)
  }, [inspector?.name, openInspector])

  return (
    <CommentsProvider
      documentId={documentId}
      documentType={documentType}
      getCommentLink={getCommentLink}
      isConnecting={connectionState === 'connecting'}
      onClearSelectedComment={handleClearSelectedComment}
      onPathOpen={onPathOpen}
      selectedCommentId={selectedCommentId}
      isCommentsOpen={inspector?.name === COMMENTS_INSPECTOR_NAME}
      onCommentsOpen={handleOpenCommentsInspector}
      sortOrder="desc"
      type="field"
    >
      {children}
    </CommentsProvider>
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
