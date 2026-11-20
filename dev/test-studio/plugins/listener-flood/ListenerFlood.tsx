import {Button, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useEffect, useState, type ChangeEvent} from 'react'
import {useClient} from 'sanity'

const LISTENER_FLOOD_API_VERSION = '2025-02-07'
const DEFAULT_LISTENER_COUNT = 60

function ListenerFloodItem() {
  const client = useClient({apiVersion: LISTENER_FLOOD_API_VERSION})

  useEffect(() => {
    const subscription = client.listen('*[_type == "listenerFloodDocument"]').subscribe()
    return () => subscription.unsubscribe()
  }, [client])

  return null
}

export function ListenerFlood() {
  const [listenerCount, setListenerCount] = useState(DEFAULT_LISTENER_COUNT)
  const [listenerIds, setListenerIds] = useState<string[]>([])

  function handleListenerCountChange(event: ChangeEvent<HTMLInputElement>) {
    setListenerCount(Number(event.currentTarget.value))
  }

  function handleOpen() {
    setListenerIds(Array.from({length: listenerCount}, () => crypto.randomUUID()))
  }

  function handleClose() {
    setListenerIds([])
  }

  const isOpen = listenerIds.length > 0
  const isClosed = listenerIds.length === 0

  return (
    <Card sizing="border" padding={5}>
      <Stack gap={4}>
        <Text>
          Opens the given number of listeners through <code>useClient().listen</code>, to trigger
          the dev-mode excessive listener count warning.
        </Text>
        <Flex gap={2} align="center">
          <TextInput
            type="number"
            value={String(listenerCount)}
            onChange={handleListenerCountChange}
            disabled={isOpen}
          />
          <Button text="Open" tone="positive" onClick={handleOpen} disabled={isOpen} />
          <Button text="Close" tone="critical" onClick={handleClose} disabled={isClosed} />
        </Flex>
        <Text size={1} muted data-testid="listener-flood-count">
          {isOpen ? `${listenerIds.length} listeners open` : 'Listeners closed'}
        </Text>
        {listenerIds.map((listenerId) => (
          <ListenerFloodItem key={listenerId} />
        ))}
      </Stack>
    </Card>
  )
}
