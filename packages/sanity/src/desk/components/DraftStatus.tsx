import React from 'react'
import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TextWithTone, useTimeAgo} from 'sanity'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  // Label with abbreviations and suffix
  const lastUpdatedTimeAgo = useTimeAgo(updatedAt || '', {minimal: true, agoSuffix: true})

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>{document ? `Edited ${lastUpdatedTimeAgo}` : 'No unpublished edits'}</Text>
        </Box>
      }
    >
      <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
        <EditIcon />
      </TextWithTone>
    </Tooltip>
  )
}
