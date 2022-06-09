import {Box, Card, Code, Container, Flex, Stack, Text} from '@sanity/ui'
import {useBoolean, useNumber, useString} from '@sanity/ui-workshop'
import React from 'react'
import {useSchema} from '../../hooks'
import {SanityPreview} from '../../preview'
import {useDocumentSearchResults} from '../useDocumentSearchResults'

export default function DevStory() {
  const schema = useSchema()
  const includeDrafts = useBoolean('Include drafts', true)
  const query = useString('Query', 'grrm', 'Props') ?? ''
  const limit = useNumber('Limit', 10, 'Props') || 1
  const results = useDocumentSearchResults({includeDrafts, limit, query})

  return (
    <Box padding={4}>
      <Container width={1}>
        <Stack space={2}>
          {results.value.map((result) => {
            const type = schema.get(result.hit._type)

            if (!type) {
              return (
                <Card border key={result.hit._id} padding={3} tone="critical">
                  <Text size={1}>
                    Unknown type: <code>{result.hit._type}</code>
                  </Text>
                </Card>
              )
            }

            return (
              <Card border key={result.hit._id}>
                <Box padding={2}>
                  <SanityPreview
                    schemaType={type}
                    value={{
                      _type: result.hit._type,
                      _id: result.hit._id,
                    }}
                  />
                </Box>

                <Card tone="transparent">
                  <Flex padding={3}>
                    <Box flex={1}>
                      <Code size={1}>{result.hit._id}</Code>
                    </Box>
                    <Code size={1}>{result.score.toFixed(2)}</Code>
                  </Flex>
                </Card>
              </Card>
            )
          })}
        </Stack>
      </Container>
    </Box>
  )
}
