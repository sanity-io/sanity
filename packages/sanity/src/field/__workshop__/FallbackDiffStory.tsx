import {Box} from '@sanity/ui'
import React from 'react'
import {FallbackDiff} from '../diff/components/FallbackDiff'

/**
 * TODO
 */
export default function FallbackDiffStory() {
  return (
    <Box padding={4}>
      <FallbackDiff {...({} as any)} />
    </Box>
  )
}
