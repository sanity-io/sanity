import {Box} from '@sanity/ui'
import React from 'react'
import {FieldChange} from '../diff/components/FieldChange'

/**
 * @todo
 */
export default function FieldChangeStory() {
  return (
    <Box padding={4}>
      <FieldChange {...({} as any)} />
    </Box>
  )
}
