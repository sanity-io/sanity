// Example MCP component implementation
import {Dialog, Heading, Stack, Text} from '@sanity/ui'
import {type MCPComponentProps} from 'sanity'

export function ExampleMCPComponent(props: MCPComponentProps) {
  const {active, onDeactivate} = props
  //eslint-disable-next-line no-console
  console.log('MCP context', props.context)
  return active ? (
    <Dialog id="mcp-dialog" width={1} onClose={onDeactivate} onClick={onDeactivate}>
      <Stack padding={3} space={3}>
        <Heading as="h2">Hello world</Heading>
        <Text>MCP Context logged to console</Text>
      </Stack>
    </Dialog>
  ) : null
}
