import {Card, Stack, Text} from '@sanity/ui'
import React, {useCallback, useMemo} from 'react'
import Preview from 'part:@sanity/base/preview'
import schema from 'part:@sanity/base/schema'
import {useRouter} from 'part:@sanity/base/router'
import DraftStatus from './DraftStatus'

export default function ReferringDocumentsList(props) {
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

function DocumentPreviewLink(props) {
  const {document} = props
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
      <Preview status={document._hasDraft && <DraftStatus />} type={schemaType} value={document} />
    </Card>
  )
}
