import React from 'react'
import {Card, Text} from '@sanity/ui'

export function MissingDocumentTypesMessage() {
  return (
    <Card
      data-testid="missing-document-types-message"
      height="fill"
      paddingX={[5, 5, 7]}
      paddingY={[5, 5, 6]}
      sizing="border"
    >
      <Text as="p" align="center">
        We’ll generate a UI here as soon as you{' '}
        <a href="https://www.sanity.io/docs/create-a-schema-and-configure-sanity-studio">
          build your first schema
        </a>
        .
      </Text>
    </Card>
  )
}
