import {useEffect} from 'react'

import {getPublishedId, isVersionId} from '../../../util/draftUtils'
import {useIsLastPane} from '../../context/isLastPane/useIsLastPane'
import {type ActiveDocument} from '../../context/tasks/types'
import {useTasks} from '../../context/tasks/useTasks'

export default function SetActiveDocument(document: ActiveDocument) {
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
