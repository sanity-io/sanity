import {UnpublishIcon} from '@sanity/icons'
import {useState, useCallback, useEffect} from 'react'
import {
  DocumentEnhancementHookContext,
  DocumentEnhancementHookDefinition,
  useEditState,
  useDocumentOperation,
  defineDocumentEnhancement,
} from 'sanity'

function useUnpublishAction(
  props: DocumentEnhancementHookContext
): DocumentEnhancementHookDefinition {
  const {documentId, documentType} = props
  const {published} = useEditState(documentId, documentType)
  const {unpublish} = useDocumentOperation(documentId, documentType)
  const [loading, setLoading] = useState<boolean>(false)

  const handleClick = useCallback(() => {
    setLoading(true)
    unpublish.execute()
  }, [unpublish])

  useEffect(() => {
    if (!published) {
      setLoading(false)
    }
  }, [published])

  return {
    disabled: !published || loading,
    icon: UnpublishIcon,
    onClick: handleClick,
    title: 'Unpublish (hook)',
    tone: 'critical',
  }
}

export const unpublishEnhancement = defineDocumentEnhancement({
  name: 'unpublish',
  use: useUnpublishAction,
})
