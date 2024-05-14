import {Box, Button, Card, Flex, Heading, Stack, TextInput} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {checkoutPair, type DocumentVersionEvent, useClient} from 'sanity'

export function ListenerDebug() {
  const [visible, setVisible] = useState(false)
  const [ids, setIds] = useState<string[]>(['foo', 'bar', 'baz'])
  const textInputRef = useRef<HTMLInputElement | null>(null)
  const handleAdd = useCallback(() => {
    setIds((currentIds) =>
      Array.from(new Set(currentIds.concat(textInputRef.current?.value || ''))),
    )
  }, [])

  return (
    <Card padding={2} margin={2}>
      <Stack space={4} padding={3}>
        <Flex>
          <Button type="button" onClick={() => setVisible((v) => !v)}>
            {visible ? 'Toggle visibility' : 'Toggle visibility'}
          </Button>
        </Flex>
        {visible ? (
          <>
            <Flex gap={3}>
              <Box flex={1}>
                <TextInput ref={textInputRef} />
              </Box>
              <Button onClick={handleAdd} text="Add document id" />
            </Flex>
            <Stack space={2}>
              {ids.map((id) => (
                <>
                  <Card padding={3} margin={2} border radius={3}>
                    <Document key={id} id={id} />
                  </Card>
                </>
              ))}
            </Stack>
          </>
        ) : null}
      </Stack>
    </Card>
  )
}

function Document(props: {id: string}) {
  const {id} = props
  const [event, setEvent] = useState<DocumentVersionEvent>()
  const client = useClient({apiVersion: '2024-05-14'})
  const pair = useMemo(
    () => checkoutPair(client, {draftId: `drafts.${id}`, publishedId: id}, false),
    [client, id],
  )

  useEffect(() => {
    const sub = pair.draft.events.subscribe((ev) => {
      setEvent(ev)
    })
    return () => {
      sub.unsubscribe()
    }
  }, [pair.draft.events])
  return (
    <Stack space={2}>
      <Heading as="h2">{id}</Heading>
      <code>{JSON.stringify(event, null, 2)}</code>
    </Stack>
  )
}
