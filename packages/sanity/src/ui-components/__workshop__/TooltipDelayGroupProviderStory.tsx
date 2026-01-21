import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useString} from '@sanity/ui-workshop'

import {Button} from '../button/Button'
import {Tooltip} from '../tooltip/Tooltip'
import {TooltipDelayGroupProvider} from '../tooltipDelayGroupProvider/TooltipDelayGroupProvider'

export default function TooltipDelayGroupProviderStory() {
  const text = useString('Tooltip content', 'Tooltip content', 'Props') || ''

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            The <code>TooltipDelayGroupProvider</code> component enforces shared tooltip delay
            values in use throughout the Studio.
          </Text>
        </Card>

        <Card border radius={2}>
          <Box marginBottom={3} padding={3}>
            <Text size={2} weight="medium">
              Usage examples
            </Text>
          </Box>
          <Stack padding={3} space={4}>
            <Stack space={3}>
              <Text muted size={1}>
                Default
              </Text>
              <TooltipDelayGroupProvider>
                <Flex gap={2}>
                  <Tooltip content={text}>
                    <Button text="Button 1" />
                  </Tooltip>
                  <Tooltip content={text}>
                    <Button text="Button 2" />
                  </Tooltip>
                  <Tooltip content={text}>
                    <Button text="Button 3" />
                  </Tooltip>
                </Flex>
              </TooltipDelayGroupProvider>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
