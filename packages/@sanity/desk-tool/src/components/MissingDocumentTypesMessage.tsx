import {Heading, Stack, Text} from '@sanity/ui'
import React from 'react'

export function MissingDocumentTypesMessage() {
  return (
    <Stack space={4}>
      <Heading as="h2">Empty schema</Heading>
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
  )
}
