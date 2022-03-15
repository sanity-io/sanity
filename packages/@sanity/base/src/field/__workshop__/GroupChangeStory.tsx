import {Box} from '@sanity/ui'
import React from 'react'
import {GroupChange} from '../diff/components/GroupChange'

/**
 * @todo
 */
export default function GroupChangeStory() {
  return (
    <Box padding={4}>
      <GroupChange {...({} as any)} />
    </Box>
  )
}
