import React from 'react'
import {PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Text} from '@sanity/ui'
import {Tooltip} from '../../ui'
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
        <Text size={1}>
          {document ? (
            <>Published {updatedAt && <TimeAgo time={updatedAt} />}</>
          ) : (
            <>Not published</>
          )}
        </Text>
      }
    >
      <TextWithTone tone="positive" dimmed={!document} muted={!document} size={1}>
        <PublishIcon aria-label={statusLabel} />
      </TextWithTone>
    </Tooltip>
  )
}
