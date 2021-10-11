import {PaneRouterContext} from '@sanity/desk-tool'
import {AddIcon, RemoveIcon} from '@sanity/icons'
import {Button, Card, Code, Inline, Label, Stack, Text} from '@sanity/ui'
import React, {useCallback, useContext} from 'react'

function DeveloperPreview(props) {
  const {payload = {}, setPayload} = useContext(PaneRouterContext)
  const {displayed} = props.document
  const {count = 0} = payload

  const handleDecr = useCallback(() => setPayload({count: count - 1}), [count, setPayload])
  const handleIncr = useCallback(() => setPayload({count: count + 1}), [count, setPayload])

  return (
    <Card height="fill" overflow="auto" padding={4} sizing="border" tone="transparent">
      <Stack space={5}>
        <Stack space={3}>
          <Label>Count payload</Label>
          <Inline space={2}>
            <Button icon={RemoveIcon} mode="ghost" padding={2} type="button" onClick={handleDecr} />
            <Text>{count}</Text>
            <Button icon={AddIcon} mode="ghost" padding={2} type="button" onClick={handleIncr} />
          </Inline>
        </Stack>

        <Stack space={3}>
          <Label>Displayed document</Label>
          <Code language="json">{JSON.stringify(displayed, null, 2)}</Code>
        </Stack>
      </Stack>
    </Card>
  )
}

export default DeveloperPreview
