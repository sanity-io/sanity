import {UnknownIcon} from '@sanity/icons'
import {Box, Card, Code, Flex, Stack, Text} from '@sanity/ui'
import React, {createElement} from 'react'
import {useSource} from '../../source'

export default function TemplatesStory() {
  const source = useSource()

  return (
    <Box padding={4}>
      {source.initialValueTemplates.map((tpl) => (
        <Card border key={tpl.id} padding={3}>
          <Flex>
            <Text>{createElement(tpl.icon || UnknownIcon)}</Text>
            <Stack flex={1} marginLeft={3} space={2}>
              <Text>{tpl.title}</Text>
              {tpl.description && (
                <Text muted size={1}>
                  {tpl.description}
                </Text>
              )}
              {tpl.parameters && <Code>{JSON.stringify(tpl.parameters)}</Code>}
            </Stack>
          </Flex>
        </Card>
      ))}
    </Box>
  )
}
