import {useEffect} from 'react'
import {getPublishedId} from 'sanity'

import {usePane} from '../../../../structure/components'
import {useTasks} from '../context'

export function SetActiveDocument({documentId}: {documentId: string}) {
  const {isLast} = usePane()
  const {setActiveDocumentId} = useTasks()

  useEffect(() => {
    if (documentId && isLast) {
      setActiveDocumentId?.(getPublishedId(documentId))
    }

    return () => {
      if (isLast) {
        setActiveDocumentId?.(undefined)
      }
    }
  }, [documentId, isLast, setActiveDocumentId])

  return null
}
