import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoToolsScreen() {
  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={0}>
          <Card padding={4} radius={2} shadow={1} tone="caution">
            <Flex>
              <Box>
                <Text size={1}>
                  <WarningOutlineIcon />
                </Text>
              </Box>
              <Stack flex={1} marginLeft={3} space={3}>
                <Text as="h1" size={1} weight="bold">
                  No configured tools
                </Text>
                <Text as="p" muted size={1}>
                  Please configure a tool in your Studio configuration.
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://www.sanity.io/docs/studio-tools"
                    rel="noreferrer"
                    target="_blank"
                  >
                    Learn how to add a tool &rarr;
                  </a>
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
