import React from 'react'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TextWithTone} from '@sanity/base/components'
import {PublishIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {TimeAgo} from './TimeAgo'

export const PublishedStatus = ({document}: {document?: SanityDocument | null}) => (
  <Tooltip
    portal
    content={
      <Box padding={2}>
        <Text size={1}>
          {document ? (
            <>Published {document._updatedAt && <TimeAgo time={document._updatedAt} />}</>
          ) : (
            <>Not published</>
          )}
        </Text>
      </Box>
    }
  >
    <TextWithTone tone="positive" dimmed={!document} muted={!document} size={1}>
      <PublishIcon />
    </TextWithTone>
  </Tooltip>
)
