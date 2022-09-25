import {Box} from '@sanity/ui'
import React from 'react'
import {DiffString} from '../diff'

/**
 * TODO
 */
export default function DiffStringStory() {
  return (
    <Box padding={4}>
      <DiffString {...({} as any)} />
    </Box>
  )
}
