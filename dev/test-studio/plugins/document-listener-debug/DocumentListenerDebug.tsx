import {Button, Card, Code, Inline, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {useEditState} from 'sanity'

const IDS = ['2kXlsm7wlxP522CbJpVLtV', '2kXlsm7wlxP522CbJpVMHh']

export function DocumentListenerDebug() {
  const [selected, setSelected] = useState(IDS[0])
  return (
    <Card sizing="border" padding={5}>
      <Stack space={3}>
        <Text weight="semibold">Select document</Text>
        <Inline space={2}>
          {IDS.map((id) => (
            <Button
              mode="ghost"
              selected={selected === id}
              key={id}
              onClick={() => setSelected(id)}
            >
              {id}
            </Button>
          ))}
        </Inline>
        <Document id={selected} type="species" />
      </Stack>
    </Card>
  )
}

function Document(props: {id: string; type: string}) {
  const editState = useEditState(props.id, props.type)
  return (
    <Stack space={3}>
      <Text weight="semibold">Edit state</Text>
      <Code language="json" size={1}>
        {JSON.stringify(editState, null, 2)}
      </Code>
    </Stack>
  )
}
