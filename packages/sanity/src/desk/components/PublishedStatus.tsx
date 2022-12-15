import i18n from 'i18next'
import k from './../../i18n/keys'
import React from 'react'
import {PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TimeAgo} from './TimeAgo'
import {TextWithTone} from 'sanity'

export function PublishedStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <>
                {i18n.t(k.PUBLISHED)} {updatedAt && <TimeAgo time={updatedAt} />}
              </>
            ) : (
              <>{i18n.t(k.NOT_PUBLISHED)}</>
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
}
