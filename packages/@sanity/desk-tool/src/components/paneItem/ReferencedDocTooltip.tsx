import React from 'react'
import {Tooltip, Text, Box} from '@sanity/ui'
import {LinkIcon} from '@sanity/icons'

export function ReferencedDocTooltip({totalReferenceCount}: {totalReferenceCount?: number}) {
  return (
    <Box marginLeft={2} marginRight={4}>
      <Text>
        <Tooltip
          content={
            <Box padding={2}>
              <Text size={1}>
                Referenced by {totalReferenceCount}
                {totalReferenceCount === 1 ? ' document' : ' documents'}
              </Text>
            </Box>
          }
          placement="right"
          fallbackPlacements={['bottom']}
          portal
        >
          <LinkIcon />
        </Tooltip>
      </Text>
    </Box>
  )
}
