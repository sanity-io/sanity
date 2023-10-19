import React from 'react'
import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Tooltip} from '../../ui'
import {TextWithTone, useTimeAgo} from 'sanity'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  // Label with abbreviations and suffix
  const lastEditedTime = useTimeAgo(updatedAt || '', {minimal: true, agoSuffix: true})

  return (
    <Tooltip text={document ? `Edited ${updatedAt ? lastEditedTime : ''}` : 'No unpublished edits'}>
      <TextWithTone tone="caution" dimmed={!document} muted={!document} size={1}>
        <EditIcon />
      </TextWithTone>
    </Tooltip>
  )
}
