import React from 'react'
import {PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TimeAgo} from './TimeAgo'
import {TextWithTone} from 'sanity'

export function PublishedStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt
  const statusLabel = document ? 'Published' : 'Not published'

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <>Published {updatedAt && <TimeAgo time={updatedAt} />}</>
            ) : (
              <>Not published</>
            )}
          </Text>
        </Box>
      }
    >
      <TextWithTone tone="positive" dimmed={!document} muted={!document} size={1}>
        <PublishIcon aria-label={statusLabel} />
      </TextWithTone>
    </Tooltip>
  )
}
