import {Box, Code, Text} from '@sanity/ui'
import React, {useEffect, useState} from 'react'
import {Button} from '../../../ui-components'
import {useDocumentStore} from '../datastores'
import {RemoteSnapshotVersionEvent} from '../document/document-pair/checkoutPair'

export default function DocumentPairStory() {
  const documentStore = useDocumentStore()
  const [draftSnapshot, setDraftSnapshot] = useState<RemoteSnapshotVersionEvent | null>(null)
  const [publishedSnapshot, setPublishedSnapshot] = useState<RemoteSnapshotVersionEvent | null>(
    null,
  )

  useEffect(() => {
    const {draft, published} = documentStore.checkoutPair({
      draftId: 'drafts.test',
      publishedId: 'test',
    })

    const draftSub = draft.remoteSnapshot$.subscribe(setDraftSnapshot)
    const publishedSub = published.remoteSnapshot$.subscribe(setPublishedSnapshot)

    return () => {
      draftSub.unsubscribe()
      publishedSub.unsubscribe()
    }
  }, [documentStore])

  return (
    <Box padding={4}>
      <Text size={1} weight="medium">
        <code>{`documentStore.checkoutPair({draftId: string, publishedId: string})`}</code>
      </Text>

      <Box hidden>
        <Button text="Subscribe" />
      </Box>

      <Box marginTop={3}>
        <Code language="json" size={1}>
          {JSON.stringify(
            {draft: {snapshot: draftSnapshot}, published: {snapshot: publishedSnapshot}},
            null,
            2,
          )}
        </Code>
      </Box>
    </Box>
  )
}
