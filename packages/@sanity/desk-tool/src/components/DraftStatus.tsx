import React from 'react'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TextWithTone} from '@sanity/base/components'
import {EditIcon} from '@sanity/icons'
import {SanityDocument} from '@sanity/types'
import {TimeAgo} from './TimeAgo'

export const DraftStatus = ({document}: {document?: SanityDocument | null}) => (
  <Tooltip
    content={
      <Box padding={2}>
        <Text size={1}>
          {document ? (
            <>Edited {document?._updatedAt && <TimeAgo time={document?._updatedAt} />}</>
          ) : (
            <>No unpublished edits</>
          )}
        </Text>
      </Box>
    }
  >
    <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
      <EditIcon />
    </TextWithTone>
  </Tooltip>
)
