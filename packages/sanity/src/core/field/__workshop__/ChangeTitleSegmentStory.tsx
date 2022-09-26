import {Box} from '@sanity/ui'
import React from 'react'
import {ChangeTitleSegment} from '../diff/components/ChangeTitleSegment'

export default function ChangeTitleSegmentStory() {
  return (
    <Box padding={4}>
      <ChangeTitleSegment segment="Test" />
    </Box>
  )
}
