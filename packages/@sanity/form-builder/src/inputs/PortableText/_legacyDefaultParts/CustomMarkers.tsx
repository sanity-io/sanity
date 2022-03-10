import React from 'react'
import {Text} from '@sanity/ui'

// This is the fallback marker renderer if the block editor didn't get the 'renderCustomMarkers' prop
// You will probably only see this when you first start to play with custom markers as a developer
export function DefaultCustomMarkers() {
  return (
    <Text size={1}>
      This is a example custom marker, please implement <code>renderCustomMarkers</code> function.
    </Text>
  )
}
