import {type SanityDocument} from '@sanity/types'
import {Box, Code, Flex, Spinner, Text} from '@sanity/ui'
import {type Ref, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react'
import {type Subscription} from 'rxjs'
import {useClient} from 'sanity'

export function JsonDocumentDump(props: {
  itemId: string
  ref: Ref<{actionHandlers: Record<string, () => void>}>
}) {
  const {itemId, ref} = props
  const draftId = `drafts.${itemId}`
  const query = '*[_id in [$itemId, $draftId]]'

  const client = useClient({apiVersion: '2022-09-09'})
  const [isLoading, setIsLoading] = useState(true)
  const [document, setDocument] = useState<SanityDocument | null>(null)
  const subscriptionRef = useRef<Subscription | undefined>(undefined)

  const fetchDocument = useCallback(() => {
    return client.observable
      .fetch(`${query} | order(_updatedAt desc) [0]`, {itemId, draftId})
      .subscribe((nextDocument) => {
        setDocument(nextDocument || null)
        setIsLoading(false)
      })
  }, [client.observable, draftId, itemId])

  useImperativeHandle(
    ref,
    () => ({
      actionHandlers: {
        reload: () => {
          subscriptionRef.current?.unsubscribe()
          setIsLoading(true)
          subscriptionRef.current = fetchDocument()
        },
      },
    }),
    [fetchDocument],
  )

  useEffect(() => {
    const subscription = client.observable
      .listen(query, {itemId, draftId}, {includeAllVersions: true})
      .subscribe((mut) => {
        setDocument(mut.result || null)
      })
    return () => subscription.unsubscribe()
  }, [client.observable, draftId, itemId])

  const hasDocument = document !== null
  useEffect(() => {
    if (hasDocument) return undefined
    const subscription = fetchDocument()
    subscriptionRef.current = subscription

    return () => subscription.unsubscribe()
  }, [fetchDocument, hasDocument])

  if (isLoading) {
    return (
      <Flex align="center" direction="column" height="fill" justify="center">
        <Spinner muted />
        <Box marginTop={3}>
          <Text align="center" muted size={1}>
            Loading document…
          </Text>
        </Box>
      </Flex>
    )
  }

  if (!document) {
    return (
      <Box padding={4}>
        <Text muted>Document not found.</Text>
      </Box>
    )
  }

  return (
    <Box height="fill" overflow="auto" padding={4} sizing="border">
      <Code language="json" size={[1, 1, 2]}>
        {JSON.stringify(document, null, 2)}
      </Code>
    </Box>
  )
}
