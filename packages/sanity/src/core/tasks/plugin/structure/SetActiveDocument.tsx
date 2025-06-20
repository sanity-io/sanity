import {useEffect} from 'react'

import {getPublishedId, isVersionId} from '../../../util/draftUtils'
import type {ActiveDocument} from '../../context/tasks/types'
import {useIsLastPane} from '../../context/isLastPane/useIsLastPane'
import {useTasks} from '../../context/tasks/useTasks'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'

function SetActiveDocumentInner(document: ActiveDocument) {
  const {documentId, documentType} = document
  const isLast = useIsLastPane()
  const {setActiveDocument} = useTasks()

  useEffect(() => {
    if (documentId && isLast && documentType) {
      setActiveDocument?.({
        // Use the version id if it's a version document.
        documentId: isVersionId(documentId) ? documentId : getPublishedId(documentId),
        documentType,
      })
    }

    return () => {
      if (isLast) {
        setActiveDocument?.(null)
      }
    }
  }, [documentId, documentType, isLast, setActiveDocument])

  return null
}

export function SetActiveDocument(document: ActiveDocument) {
  const {enabled} = useTasksEnabled()
  if (!enabled) return null
  return <SetActiveDocumentInner {...document} />
}
