import {Card, Stack, Text, TextInput} from '@sanity/ui'
import {Button} from '../../../../ui-components'

export const TasksCreate = () => {
  return (
    <Card padding={4}>
      <Stack space={3}>
        <Text>Create a task</Text>
        <TextInput placeholder="Create new task" />
      </Stack>
      <Button text="Create" />
    </Card>
  )
}
