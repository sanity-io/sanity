import {useMemo} from 'react'
import {
  isPublishedPerspective,
  prepareForPreview,
  unstable_useValuePreview as useValuePreview,
  usePerspective,
  useTranslation,
} from 'sanity'

import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from './useDocumentPane'

/**
 * useDocumentTitle hook return type.
 *
 * @beta
 * @hidden
 */
export interface UseDocumentTitle {
  error?: string
  title?: string
}

/**
 * React hook that returns the document title for the current document in the document pane.
 *
 * @beta
 * @hidden
 *
 * @returns The document title or error. See {@link UseDocumentTitle}
 */
export function useDocumentTitle(): UseDocumentTitle {
  const {connectionState, schemaType, editState, isDeleted, lastRevisionDocument} =
    useDocumentPane()
  const {selectedPerspectiveName} = usePerspective()
  const {t} = useTranslation(structureLocaleNamespace)
  // follows the same logic as the StructureTitle component
  const documentValue = useMemo(() => {
    if (isDeleted) {
      return lastRevisionDocument
    }
    // When viewing published perspective, prioritize published document
    if (selectedPerspectiveName && isPublishedPerspective(selectedPerspectiveName)) {
      return editState?.published
    }
    return editState?.version || editState?.draft || editState?.published
  }, [isDeleted, lastRevisionDocument, editState, selectedPerspectiveName])
  const subscribed = Boolean(documentValue)

  // For deleted documents, we need to handle the preview differently since useValuePreview
  // will return null for deleted documents. Instead, we directly prepare the preview
  // from the lastRevisionDocument data.
  const deletedDocumentPreview = useMemo(() => {
    if (isDeleted && lastRevisionDocument && schemaType) {
      try {
        const prepared = prepareForPreview(lastRevisionDocument, schemaType)
        return prepared
      } catch (error) {
        console.warn('Failed to prepare preview for deleted document:', error)
        return null
      }
    }
    return null
  }, [isDeleted, lastRevisionDocument, schemaType])

  const {error, value} = useValuePreview({
    // disable useValuePreview for deleted documents
    enabled: subscribed && !isDeleted,
    schemaType,
    value: documentValue,
  })

  if (connectionState === 'connecting' && !subscribed) {
    return {error: undefined, title: undefined}
  }

  // For deleted documents, use the directly prepared preview
  if (isDeleted && deletedDocumentPreview) {
    return {error: undefined, title: deletedDocumentPreview.title}
  }

  if (!value && !isDeleted) {
    return {
      error: undefined,
      title: t('panes.document-header-title.new.text', {
        schemaType: schemaType?.title || schemaType?.name,
      }),
    }
  }

  if (error) {
    return {
      error: t('panes.document-list-pane.error.text', {error: error.message}),
      title: undefined,
    }
  }

  return {error: undefined, title: value?.title}
}
