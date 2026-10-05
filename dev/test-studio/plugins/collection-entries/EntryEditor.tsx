import {type PortableTextBlock} from '@portabletext/editor'
import {useDocument, useEditDocument} from '@sanity/sdk-react'
import {Box, Stack, Text, TextInput} from '@sanity/ui'

import {ENTRY_TYPE} from './constants'
import {EntryBodyEditor} from './EntryBodyEditor'

type EntryDocument = {
  title?: string
  body?: PortableTextBlock[]
}

interface EntryEditorProps {
  entryId: string
  readOnly: boolean
}

export function EntryEditor({entryId, readOnly}: EntryEditorProps) {
  const entryHandle = {documentId: entryId, documentType: ENTRY_TYPE}
  const {data: entry} = useDocument<EntryDocument>(entryHandle)
  const editTitle = useEditDocument({...entryHandle, path: 'title'})

  return entry === null ? (
    <Text muted size={1}>
      This entry document no longer exists.
    </Text>
  ) : (
    <Stack gap={3}>
      <Box data-entry-field="title">
        <TextInput
          aria-label="Title"
          fontSize={2}
          placeholder="Title"
          readOnly={readOnly}
          value={entry.title ?? ''}
          onChange={(event) => editTitle(event.currentTarget.value)}
        />
      </Box>
      <EntryBodyEditor entryId={entryId} initialValue={entry.body} readOnly={readOnly} />
    </Stack>
  )
}
