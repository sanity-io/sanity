import {useEffect} from 'react'

import {usePane} from '../../../../structure/components'
import {getPublishedId} from '../../../util'
import {type ActiveDocument, useTasks, useTasksEnabled} from '../../context'

function SetActiveDocumentInner(document: ActiveDocument) {
  const {documentId, documentType} = document
  const {isLast} = usePane()
  const {setActiveDocument} = useTasks()

  useEffect(() => {
    if (documentId && isLast && documentType) {
      setActiveDocument?.({
        documentId: getPublishedId(documentId),
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
