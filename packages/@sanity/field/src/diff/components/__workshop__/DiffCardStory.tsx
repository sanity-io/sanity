import {Box, Container, Flex, Text} from '@sanity/ui'
import React from 'react'
import {Annotation} from '../../../types'
import {DiffCard} from '../DiffCard'

export default function DiffCardStory() {
  const annotation: Annotation = {
    chunk: {
      index: 0,
      id: 'test',
      type: 'create',
      start: 0,
      end: 10,
      startTimestamp: new Date().toUTCString(),
      endTimestamp: new Date().toUTCString(),
      authors: new Set(),
      draftState: 'present',
      publishedState: 'present',
    },
    timestamp: new Date().toUTCString(),
    author: 'p27ewL8aM',
  }

  return (
    <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
      <Container width={0}>
        <DiffCard annotation={annotation} tooltip={{description: <>Changed by</>}}>
          <Box padding={3}>
            <Text>Diff</Text>
          </Box>
        </DiffCard>
      </Container>
    </Flex>
  )
}
