import {Box, Heading} from '@sanity/ui'
import React from 'react'
import {VisionError} from '../types'
import {QueryErrorDetails} from './QueryErrorDetails'

export function QueryErrorDialog(props: {error: VisionError}) {
  return (
    <div className="vision_query-error">
      <Heading as="h2">Query error</Heading>
      <Box marginTop={4}>
        <QueryErrorDetails error={props.error} />
      </Box>
    </div>
  )
}
