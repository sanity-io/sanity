import {useClient} from 'sanity'
import {SanityDocument} from '@sanity/types'
import {Box, Code, Flex, Spinner, Text} from '@sanity/ui'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {Subscription} from 'rxjs'

export const JsonDocumentDump = forwardRef(function JsonDocumentDump(
  props: {itemId: string},
  ref: React.ForwardedRef<{actionHandlers: Record<string, () => void>}>,
) {
  const {itemId} = props
  const client = useClient({apiVersion: '2022-09-09'})
  const [state, setState] = useState<{document?: SanityDocument; isLoading: boolean}>({
    isLoading: true,
  })
  const {isLoading, document} = state

  const sub1Ref = useRef<Subscription | undefined>()
  const sub2Ref = useRef<Subscription | undefined>()

  const setup = useCallback(() => {
    setState({isLoading: true, document: undefined})

    const draftId = `drafts.${itemId}`
    const query = '*[_id in [$itemId, $draftId]]'
    const params = {itemId, draftId}

    sub1Ref.current = client.observable
      .fetch(`${query} | order(_updatedAt desc) [0]`, params)
      .subscribe((nextDocument) =>
        setState({document: nextDocument || undefined, isLoading: false}),
      )

    sub2Ref.current = client.observable
      .listen(query, params)
      .subscribe((mut) => setState({document: mut.result || undefined, isLoading: false}))
  }, [client, itemId])

  const teardown = useCallback(() => {
    sub1Ref.current?.unsubscribe()
    sub2Ref.current?.unsubscribe()
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      actionHandlers: {
        reload: () => {
          teardown()
          setup()
        },
      },
    }),
    [setup, teardown],
  )

  useEffect(() => {
    setup()
    return () => teardown()
  }, [setup, teardown])

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
})
