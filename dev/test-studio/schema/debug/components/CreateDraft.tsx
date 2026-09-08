import {Button, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  getDraftId,
  getTargetSiblings,
  useClient,
  usePerspective,
  useVariantDocumentOperations,
} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

export function CreateDraft() {
  const {documentId, documentType, value, targetDocumentState} = useDocumentPane()
  const {selectedVariant} = usePerspective()
  const {createVariantDocument} = useVariantDocumentOperations()
  const client = useClient({apiVersion: '2025-01-30'})
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const siblings = getTargetSiblings(targetDocumentState)
  const draftId = siblings?.draft?._id

  const createDraft = useCallback(async () => {
    const handleCreate = async () => {
      const baseDocument = {
        ...value,
        _type: documentType,
        name: `${value.name} (draft)`,
      }
      if (selectedVariant?._id) {
        await createVariantDocument({
          document: baseDocument,
          documentGroupId: documentId,
          selectedPerspective: 'drafts',
          variant: {_id: selectedVariant._id},
        })
      } else {
        await client.createIfNotExists({
          ...baseDocument,
          _id: getDraftId(documentId),
        })
      }
    }
    try {
      setCreatingDraft(true)
      await handleCreate()
    } catch (e) {
      setError(e)
    }
    setCreatingDraft(false)
  }, [client, documentId, documentType, value, selectedVariant, createVariantDocument])

  return (
    <Stack gap={2}>
      <Button
        loading={creatingDraft}
        onClick={createDraft}
        width="fill"
        text={'Create Draft'}
        disabled={Boolean(draftId) || creatingDraft}
      />
      {error && <Text size={0}>{error.message}</Text>}
    </Stack>
  )
}
