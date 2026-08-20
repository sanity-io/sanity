import {type Path} from '@sanity/types'
import {Stack, Text} from '@sanity/ui'
import {fromString as pathFromString} from '@sanity/util/paths'
import {memo, useMemo} from 'react'
import {
  CopyPasteProvider,
  getCreatableVariantTarget,
  getPublishedId,
  ReferenceInputOptionsProvider,
  SourceProvider,
  Translate,
  useDocumentType,
  usePerspective,
  useSource,
  useTargetDocumentState,
  useTemplatePermissions,
  useTranslation,
} from 'sanity'

import {usePaneRouter} from '../../components/paneRouter/usePaneRouter'
import {DiffViewDocumentLayout} from '../../diffView/plugin/DiffViewDocumentLayout'
import {structureLocaleNamespace} from '../../i18n'
import {type DocumentPaneNode} from '../../types'
import {ErrorPane} from '../error'
import {LoadingPane} from '../loading'
import {CommentsWrapper} from './comments/CommentsWrapper'
import {useDocumentLayoutComponent} from './document-layout/useDocumentLayoutComponent'
import {DocumentPaneProviderWrapper} from './DocumentPaneProviderWrapper'
import {type DocumentPaneProviderProps} from './types'
import {usePaneOptions} from './usePaneOptions'
import {useResetHistoryParams} from './useResetHistoryParams'

type DocumentPaneOptions = DocumentPaneNode['options']

/**
 * @internal
 */
export const DocumentPane = memo(function DocumentPane(props: DocumentPaneProviderProps) {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {resolveNewDocumentOptions} = useSource().document
  const {selectedPerspectiveName, selectedVariantName} = usePerspective()
  const paneRouter = usePaneRouter()
  const options = usePaneOptions(pane.options, paneRouter.params)
  const {documentType, isLoaded: isDocumentLoaded} = useDocumentType(options.id, options.type)
  // Resolution state of the document targeted by the selected perspective and variant. This
  // subscription lives here — outside the keyed provider wrapper below — so it survives wrapper
  // remounts and warm remounts resolve synchronously from the shared caches.
  const targetDocumentState = useTargetDocumentState(getPublishedId(options.id))
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
        <Stack gap={4}>
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

  // When a variant is requested, block mounting the editing subtree until the target document
  // has resolved: listeners and patches must never be wired against the base draft/published
  // pair while the actual target (an opaque, server-generated version id) is still unknown.
  if (selectedVariantName && targetDocumentState.status === 'resolving') {
    return (
      <LoadingPane
        flex={2.5}
        minWidth={320}
        paneKey={paneKey}
        title={t('panes.document-pane.variant-target.loading')}
      />
    )
  }

  // Remount the editing subtree whenever the resolved variant target changes (variant switched,
  // variant document created/discarded while open), so transitions pass back through the gate
  // above instead of a mounted tree silently falling back to the base pair. Also prevents form
  // state from being reused across variants. Inert when no variant is requested.
  //
  // A creatable missing draft variant is keyed by its advertised id — the same id the created
  // stub arrives under — so the first keystroke's `variant-missing → ready` transition keeps the
  // key stable and typing is not interrupted by a remount.
  const creatableVariantTarget = getCreatableVariantTarget(targetDocumentState)
  const variantTargetKey = selectedVariantName
    ? `-${selectedVariantName}-${
        targetDocumentState.status === 'ready'
          ? (targetDocumentState.targetDocument?._id ?? 'none')
          : (creatableVariantTarget?.id ?? targetDocumentState.status)
      }`
    : ''

  return (
    <DocumentPaneProviderWrapper
      // this needs to be here to avoid formState from being re-used across (incompatible) document types
      // see https://github.com/sanity-io/sanity/discussions/3794 for a description of the problem
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      key={`${documentType}-${options.id}-${selectedPerspectiveName || ''}${variantTargetKey}`}
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
            {/* oxlint-disable-next-line react/static-components -- this is intentional and how the middleware components has to work */}
            <DocumentLayout documentId={options.id} documentType={options.type} />
          </CommentsWrapper>
        </DiffViewDocumentLayout>
      </ReferenceInputOptionsProvider>
    </DocumentPaneProviderWrapper>
  )
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
