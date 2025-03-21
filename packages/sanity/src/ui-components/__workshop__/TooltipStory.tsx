import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'

import {Button} from '../button/Button'
import {Tooltip} from '../tooltip/Tooltip'

export default function TooltipStory() {
  const text = useString('Tooltip content', 'Tooltip content', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            The <code>Tooltip</code> component enforces animation and will correctly style tooltip
            content when provided as a string (recommended). It also provides affordances for
            displaying hotkeys.
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Recommended
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              <Text muted size={1}>
                String content
              </Text>
              <Tooltip content={text}>
                <Box>
                  <Button text="Text" />
                </Box>
              </Tooltip>
            </Stack>
            <Stack space={3}>
              <Text muted size={1}>
                String content with hotkeys
              </Text>
              <Tooltip content={text} hotkeys={['Ctrl', 'Alt', 'P']}>
                <Box>
                  <Button text="Text" />
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </Card>

        <Card border radius={2} tone="caution">
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Not recommended
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              <Text muted size={1}>
                Content as <code>React.Node</code>
              </Text>
              <Tooltip
                content={
                  <Card padding={4}>
                    <Text weight="semibold">{text}</Text>
                  </Card>
                }
              >
                <Box>
                  <Button text="Text" />
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
