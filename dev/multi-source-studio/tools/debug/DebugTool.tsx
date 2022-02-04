import {useSanity} from '@sanity/base'
import {Card, Code, Heading, Stack} from '@sanity/ui'
import React from 'react'

export function DebugTool() {
  const {auth, sources} = useSanity()

  return (
    <Card padding={4}>
      <Stack space={4}>
        <Card border padding={4}>
          <Stack space={4}>
            <Heading>Auth</Heading>
            <Code language="json" size={1}>
              {JSON.stringify(auth, null, 2)}
            </Code>
          </Stack>
        </Card>

        <Card border padding={4}>
          <Stack space={4}>
            <Heading>Sources</Heading>
            <Stack space={4}>
              {sources.map((source) => (
                <Card border key={source.name} padding={4}>
                  <Stack space={3}>
                    <Heading size={1}>{source.title}</Heading>
                    <Code language="json" size={1}>
                      {JSON.stringify(
                        {
                          ...source,
                          schema: {
                            types: source.schema.getTypeNames(),
                          },
                        },
                        null,
                        2
                      )}
                    </Code>
                  </Stack>
                </Card>
              ))}
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </Card>
  )
}
