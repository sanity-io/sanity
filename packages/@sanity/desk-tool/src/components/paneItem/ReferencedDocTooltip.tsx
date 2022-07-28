import React from 'react'
import {Card, Tooltip, Text, Box} from '@sanity/ui'

export function ReferencedDocTooltip({icon}: {icon: JSX.Element}) {
  return (
    <Card marginLeft={2}>
      <Text>
        <Tooltip
          content={
            <Box padding={2}>
              <Text muted size={1}>
                This is a referenced document
              </Text>
            </Box>
          }
          placement="right"
          fallbackPlacements={['bottom']}
          portal
        >
          {icon}
        </Tooltip>
      </Text>
    </Card>
  )
}
