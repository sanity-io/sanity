import {type Path} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {memo, useMemo} from 'react'
import {
  CopyPasteProvider,
  ReferenceInputOptionsProvider,
  SourceProvider,
  Translate,
  useDocumentType,
  usePerspective,
  useSource,
  useTemplatePermissions,
  useTemplates,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../components'
import {DiffViewDocumentLayout} from '../../diffView/plugin/DiffViewDocumentLayout'
import {structureLocaleNamespace} from '../../i18n'
import {type DocumentPaneNode} from '../../types'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {CommentsWrapper} from './comments'
import {useDocumentLayoutComponent} from './document-layout'
import {DocumentPaneProviderWrapper} from './DocumentPaneProviderWrapper'
import {type DocumentPaneProviderProps} from './types'
import {useResetHistoryParams} from './useResetHistoryParams'

type DocumentPaneOptions = DocumentPaneNode['options']

/**
 * @internal
 */
export const DocumentPane = memo(function DocumentPane(props: DocumentPaneProviderProps) {
  const {name: parentSourceName} = useSource()

  return (
    <SourceProvider name={props.pane.source || parentSourceName}>
      <CopyPasteProvider>
        <DocumentPaneInner {...props} />
      </CopyPasteProvider>
    </SourceProvider>
  )
})

function DocumentPaneInner(props: DocumentPaneProviderProps) {
  const {pane, paneKey} = props
  const {resolveNewDocumentOptions} = useSource().document
  const {selectedPerspectiveName} = usePerspective()
  const paneRouter = usePaneRouter()
  const options = usePaneOptions(pane.options, paneRouter.params)
  const {documentType, isLoaded: isDocumentLoaded} = useDocumentType(options.id, options.type)
  useResetHistoryParams()
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
              components={{Code: ({children}) => <code>{children}</code>}}
            />
          </Text>
        </Stack>
      </ErrorPane>
    )
  }

  return (
    <DocumentPaneProviderWrapper
      // this needs to be here to avoid formState from being re-used across (incompatible) document types
      // see https://github.com/sanity-io/sanity/discussions/3794 for a description of the problem
      key={`${documentType}-${options.id}-${selectedPerspectiveName || ''}`}
      {...providerProps}
    >
      {/* NOTE: this is a temporary location for this provider until we */}
      {/* stabilize the reference input options formally in the form builder */}
      <ReferenceInputOptionsProvider
        EditReferenceLinkComponent={ReferenceChildLink}
        onEditReference={handleEditReference}
        initialValueTemplateItems={templatePermissions}
        activePath={activePath}
      >
        <DiffViewDocumentLayout documentId={options.id} documentType={options.type}>
          <CommentsWrapper documentId={options.id} documentType={options.type}>
            <DocumentLayout documentId={options.id} documentType={options.type} />
          </CommentsWrapper>
        </DiffViewDocumentLayout>
      </ReferenceInputOptionsProvider>
    </DocumentPaneProviderWrapper>
  )
}

/**
 * @internal
 */
export function usePaneOptions(
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
