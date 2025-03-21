/* eslint-disable react/jsx-no-bind */
import {Box, Card, Container, Stack, Text} from '@sanity/ui'
import {useState} from 'react'

import {Button} from '../button/Button'
import {Popover} from '../popover/Popover'

export default function PopoverStory() {
  const [popoverOpen, setPopoverOpen] = useState(false)

  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            All popvers in the Studio should be consistently animated, and the <code>Popover</code>{' '}
            component enforces this.
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
              <Box>
                <Popover
                  content={
                    <Box padding={3}>
                      <Text>Popover content</Text>
                    </Box>
                  }
                  open={popoverOpen}
                >
                  <Button onClick={() => setPopoverOpen(!popoverOpen)} text="Toggle popover" />
                </Popover>
              </Box>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
