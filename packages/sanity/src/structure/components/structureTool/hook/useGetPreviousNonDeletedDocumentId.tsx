import {useEffect, useState} from 'react'
import {
  getPublishedId,
  isGoingToUnpublish,
  type SanityDocument,
  type SchemaType,
  unstable_useValuePreview as useValuePreview,
  useEditState,
  usePerspective,
} from 'sanity'

import {useDocumentIdStack} from '../../../hooks/useDocumentIdStack'

export const useGetPreviousNonDeletedDocumentId = ({
  documentId,
  documentType,
  schemaType,
  documentValue,
}: {
  documentId: string
  documentType: string
  schemaType: SchemaType
  documentValue: SanityDocument | null
}) => {
  const {perspectiveStack, selectedPerspectiveName, selectedReleaseId} = usePerspective()

  const editState = useEditState(documentId, documentType, 'default', selectedReleaseId)

  const {previousId} = useDocumentIdStack({
    documentId,
    editState,
    displayed: documentValue,
  })

  const [previewId, setPreviewId] = useState(previousId)
  const [updatedStack, setUpdatedStack] = useState(perspectiveStack)

  const {value: previousDocument, isLoading: previewLoading} = useValuePreview({
    enabled: true,
    schemaType,
    value: {
      _id: previewId,
      _type: documentType,
    },
  })

  useEffect(() => {
    // Check if the current previousDocument is going to be unpublished or is deleted

    if (
      typeof previousDocument?._id === 'undefined' ||
      (previousDocument &&
        (isGoingToUnpublish(previousDocument as unknown as SanityDocument) ||
          (previousDocument as any)?._system?.delete === true))
    ) {
      if (updatedStack.length > 1) {
        // If the current document is going to be unpublished/deleted, try to get the next one in the stack
        setPreviewId(`versions.${updatedStack.slice(1)[0]}.${documentId}`)
        setUpdatedStack(updatedStack.slice(1))
      } else {
        setPreviewId(getPublishedId(documentId))
      }
    }
  }, [
    perspectiveStack,
    previousDocument,
    previewId,
    selectedPerspectiveName,
    updatedStack,
    documentId,
  ])

  return {
    previousPreviewId: previewId,
    previousPreviewDocument: previousDocument,
    previewLoading,
  }
}
