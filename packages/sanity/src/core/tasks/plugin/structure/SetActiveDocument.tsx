import {useEffect} from 'react'

import {usePane} from '../../../../structure/components'
import {getPublishedId} from '../../../util/draftUtils'
import {useTasksEnabled} from '../../context/enabled/useTasksEnabled'
import {type ActiveDocument} from '../../context/tasks/types'
import {useTasks} from '../../context/tasks/useTasks'

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
