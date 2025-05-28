import {Button, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {getDraftId, useClient} from 'sanity'
import {useDocumentPane} from 'sanity/structure'

export function CreateDraft() {
  const {documentId, documentType, value, editState} = useDocumentPane()

  const client = useClient({apiVersion: '2025-01-30'})
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const createDraft = useCallback(async () => {
    try {
      setCreatingDraft(true)
      await client.createIfNotExists({
        ...value,
        _id: getDraftId(documentId),
        _type: documentType,
        name: `${value.name} (draft)`,
      })
    } catch (e) {
      setError(e)
    } finally {
      setCreatingDraft(false)
    }
  }, [client, documentId, documentType, value])

  return (
    <Stack space={2}>
      <Button
        loading={creatingDraft}
        onClick={createDraft}
        width="fill"
        text={'Create Draft'}
        disabled={Boolean(editState?.draft) || creatingDraft}
      />
      {error && <Text size={0}>{error.message}</Text>}
    </Stack>
  )
}
