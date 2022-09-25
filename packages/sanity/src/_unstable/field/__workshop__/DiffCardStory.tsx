import {Box, Text} from '@sanity/ui'
import React, {useMemo} from 'react'
import {DiffCard} from '../diff'
import {Diff} from '../types'

export default function DiffCardStory() {
  const diff: Diff = useMemo(
    () => ({
      type: 'boolean',
      action: 'added',
      isChanged: true,
      fromValue: null,
      toValue: true,
      annotation: {
        chunk: {
          index: 0,
          id: 'foo',
          type: 'editDraft',
          start: 0,
          end: 0,
          startTimestamp: new Date('2021-01-01').toJSON(),
          endTimestamp: new Date('2021-01-02').toJSON(),
          authors: new Set(['p27ewL8aM']),
          draftState: 'present',
          publishedState: 'missing',
        },
        timestamp: new Date('2021-01-02').toJSON(),
        author: 'p27ewL8aM',
      },
    }),
    []
  )

  return (
    <Box padding={4}>
      <DiffCard
        diff={diff}
        // disableHoverEffect
        path={[]}
        tooltip={{description: 'Added'}}
      >
        <Box padding={3}>
          <Text>DiffCard</Text>
        </Box>
      </DiffCard>
    </Box>
  )
}
