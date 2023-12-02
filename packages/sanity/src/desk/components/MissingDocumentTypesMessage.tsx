import React from 'react'
import {Box, Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {WarningOutlineIcon} from '@sanity/icons'
import {useSource} from 'sanity'

export function MissingDocumentTypesMessage() {
  const {name: sourceName} = useSource()

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
                <Text as="h1" size={1} weight="medium">
                  No schema types in the <em>{sourceName}</em> source!
                </Text>
                <Text as="p" muted size={1}>
                  Please add schema types in your source configuration.
                </Text>
                <Text as="p" muted size={1}>
                  <a
                    href="https://beta.sanity.io/docs/platform/studio/config"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Learn how to add a schema types &rarr;
                  </a>
                </Text>
              </Stack>
            </Flex>
          </Card>
        </Container>
      </Flex>

      {/* <Container>
        <Stack space={5}>
          <Heading as="h1">Empty schema</Heading>

          <Text as="p">
            Your schema does not contain any document types. If it did, those types would be listed
            here.{' '}
            <a
              title="Schema documentation"
              target="_blank"
              rel="noopener noreferrer"
              href="https://www.sanity.io/docs/content-studio/the-schema"
            >
              Read more about how to add schema types
            </a>
            .
          </Text>
        </Stack>
      </Container> */}
    </Card>
  )
}
