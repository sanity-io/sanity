/* eslint-disable i18next/no-literal-string,@sanity/i18n/no-attribute-string-literals */
import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoSourcesScreen() {
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
                  No configured sources!
                </Text>
                <Text as="p" muted size={1}>
                  Please configure a source in your Studio configuration.
                </Text>
                <Text as="p" muted size={1}>
                  <a href="">Learn how to add a content source &rarr;</a>
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>
    </Card>
  )
}
