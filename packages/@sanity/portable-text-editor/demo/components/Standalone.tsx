import React, {useState} from 'react'
import {Box, Card, Heading, Text, Stack} from '@sanity/ui'
import {PortableTextBlock} from '../../src'
import {Editor} from './Editor'
import {Debug} from './Debug'

export const Standalone = () => {
  const [value, setValue] = useState<PortableTextBlock[] | undefined>(undefined)

  return (
    <>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Box marginBottom={3}>
            <Heading as="h1">Basic Editor Example</Heading>
          </Box>
          <Box marginBottom={5}>
            <Text>See the console for patches and mutations</Text>
          </Box>
          <Box marginBottom={2}>
            <Heading as="h4" size={0}>
              Editor One
            </Heading>
          </Box>
          <Box marginBottom={5}>
            <Editor value={value} setValue={setValue} />
          </Box>
        </Card>
      </Stack>
      <Stack>
        <Card padding={[3, 4, 5, 6]} sizing="border">
          <Debug value={value} />
        </Card>
      </Stack>
    </>
  )
}
