import {EditIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import {useSchema} from '../../hooks'
import {SanityPreview} from '../../preview'
import {useRouter} from '../../router'

export interface ReferringDocumentsListProps {
  documents: Record<string, any>[]
}

export function ReferringDocumentsList(props: ReferringDocumentsListProps) {
  const {documents} = props

  return (
    <Card padding={1} radius={3} shadow={1}>
      <Stack space={1}>
        {documents.map((document) => (
          <DocumentPreviewLink document={document} key={document._id} />
        ))}
      </Stack>
    </Card>
  )
}

interface DocumentPreviewLinkProps {
  document: Record<string, any>
}

function DocumentPreviewLink(props: DocumentPreviewLinkProps) {
  const {document} = props
  const schema = useSchema()
  const router = useRouter()
  const intent = useMemo(
    () => ({action: 'edit', params: {id: document._id, type: document._type}}),
    [document]
  )
  const href = router.resolveIntentLink(intent.action, intent.params)
  const schemaType = schema.get(document._type)

  const handleClick = useCallback(
    (event) => {
      if (event.shiftKey || event.metaKey) return
      event.preventDefault()
      router.navigateIntent(intent.action, intent.params)
    },
    [intent, router]
  )

  if (!schemaType) {
    return (
      <Text muted>
        A document of the unknown type <em>{document._type}</em>
      </Text>
    )
  }

  return (
    <Card as="a" href={href} onClick={handleClick} padding={1} radius={2}>
      <Flex align="center">
        <Box flex={1}>
          <SanityPreview layout="default" schemaType={schemaType} value={document as any} />
        </Box>
        {document._hasDraft && (
          <Box marginLeft={3}>
            <Text muted>
              <EditIcon />
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  )
}
