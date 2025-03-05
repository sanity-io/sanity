// Example MCP component implementation
import {Dialog, Heading, Stack, Text} from '@sanity/ui'
import {type MCPComponentProps} from 'sanity'

export function ExampleMCPComponent(props: MCPComponentProps) {
  const {active} = props

  return active ? (
    <Dialog id="mcp-dialog">
      <Stack padding={3} space={3}>
        <Heading as="h2">Hello world</Heading>
        <Stack space={1}>
          <Text>Context:</Text>
          <pre>{JSON.stringify(props.context)}</pre>
        </Stack>
      </Stack>
    </Dialog>
  ) : null
}
