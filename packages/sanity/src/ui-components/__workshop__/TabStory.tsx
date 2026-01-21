import {Box, Card, Container, Stack, TabList, Text} from '@sanity/ui'

import {Tab} from '../tab/Tab'

export default function TabStory() {
  return (
    <Container width={0} padding={4}>
      <Stack space={4}>
        <Card>
          <Text size={1}>
            The <code>Tab</code> component enforces font size and padding.
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
              <TabList>
                <Tab aria-controls="tab-controls" id="tab-1" label="Tab 1" />
                <Tab aria-controls="tab-controls" id="tab-2" label="Tab 2" />
                <Tab aria-controls="tab-controls" id="tab-3" label="Tab 3" />
                <Tab aria-controls="tab-controls" id="tab-4" label="Tab 4" />
              </TabList>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}
