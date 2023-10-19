import React from 'react'
import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {Tooltip} from '../../ui'
import {TimeAgo} from './TimeAgo'
import {TextWithTone} from 'sanity'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  return (
    <Tooltip
      portal
      content={
        <Text size={1}>
          {document ? (
            <>Edited {updatedAt && <TimeAgo time={updatedAt} />}</>
          ) : (
            <>No unpublished edits</>
          )}
        </Text>
      }
    >
      <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
        <EditIcon />
      </TextWithTone>
    </Tooltip>
  )
}
