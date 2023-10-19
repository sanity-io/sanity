import React from 'react'
import {PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Tooltip} from '../../ui'
import {TextWithTone, useTimeAgo} from 'sanity'

export function PublishedStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt
  const statusLabel = document ? 'Published' : 'Not published'

  // Label with abbreviations and suffix
  const lastPublishedTime = useTimeAgo(updatedAt || '', {minimal: true, agoSuffix: true})

  return (
    <Tooltip text={document ? `Published ${updatedAt ? lastPublishedTime : ''}` : 'Not published'}>
      <TextWithTone tone="positive" dimmed={!document} muted={!document} size={1}>
        <PublishIcon aria-label={statusLabel} />
      </TextWithTone>
    </Tooltip>
  )
}
