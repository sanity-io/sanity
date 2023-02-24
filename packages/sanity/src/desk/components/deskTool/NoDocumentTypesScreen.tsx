import {WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import React from 'react'

export function NoDocumentTypesScreen() {
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
                  No document types
                </Text>
                <Text as="p" muted size={1}>
                  Please define at least one document type in your schema.
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://www.sanity.io/docs/create-a-schema-and-configure-sanity-studio"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Learn how to add a document type &rarr;
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
