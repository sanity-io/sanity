// Example MCP component implementation
import {Dialog, Heading, Stack, Text} from '@sanity/ui'
import {type MCPComponentProps} from 'sanity'

export function ExampleMCPComponent(props: MCPComponentProps) {
  const {active, onDeactivate} = props
  return active ? (
    <Dialog id="mcp-dialog" width={1} onClose={onDeactivate} onClick={onDeactivate}>
      <Stack padding={3} space={3}>
        <Heading as="h2">Hello world</Heading>
        <Stack space={1}>
          <Text>Context:</Text>
          <pre>{JSON.stringify(props.context, null, 2)}</pre>
        </Stack>
      </Stack>
    </Dialog>
  ) : null
}
