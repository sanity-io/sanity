import {Box} from '@sanity/ui'
import React from 'react'
import {DiffInspectWrapper} from '../diff/components/DiffInspectWrapper'

/**
 * @todo
 */
export default function DiffInspectWrapperStory() {
  return (
    <Box padding={4}>
      <DiffInspectWrapper {...({} as any)} />
    </Box>
  )
}
