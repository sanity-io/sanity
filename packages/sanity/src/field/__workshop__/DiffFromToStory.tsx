import {Box} from '@sanity/ui'
import React from 'react'
import {DiffFromTo} from '../diff'

/**
 * @todo
 */
export default function DiffFromToStory() {
  return (
    <Box padding={4}>
      <DiffFromTo {...({} as any)} />
    </Box>
  )
}
