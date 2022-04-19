import React from 'react'
import {Card, Container, Heading, Stack, Text} from '@sanity/ui'

export function MissingDocumentTypesMessage() {
  return (
    <Card
      data-testid="missing-document-types-message"
      height="fill"
      paddingX={[5, 5, 7]}
      paddingY={[5, 5, 6]}
      sizing="border"
    >
      <Container>
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
      </Container>
    </Card>
  )
}
