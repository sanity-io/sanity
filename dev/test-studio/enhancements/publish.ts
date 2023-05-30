import {PublishIcon} from '@sanity/icons'
import {useState, useCallback, useEffect} from 'react'
import {
  DocumentEnhancementHookContext,
  DocumentEnhancementHookDefinition,
  useEditState,
  useDocumentOperation,
  defineDocumentEnhancement,
} from 'sanity'

function usePublishAction(
  props: DocumentEnhancementHookContext
): DocumentEnhancementHookDefinition {
  const {documentId, documentType} = props
  const {draft} = useEditState(documentId, documentType)
  const {publish} = useDocumentOperation(documentId, documentType)
  const [loading, setLoading] = useState<boolean>(false)

  const handleClick = useCallback(() => {
    setLoading(true)
    publish.execute()
  }, [publish])

  useEffect(() => {
    if (!draft) {
      setLoading(false)
    }
  }, [draft])

  return {
    disabled: !draft || loading,
    icon: PublishIcon,
    onClick: handleClick,
    title: 'Publish (hook)',
    tone: 'positive',
  }
}

export const publishEnhancement = defineDocumentEnhancement({
  name: 'publish',
  use: usePublishAction,
})
