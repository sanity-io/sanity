import i18n from 'i18next'
import k from './../../i18n/keys'
import React from 'react'
import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {TimeAgo} from './TimeAgo'
import {TextWithTone} from 'sanity'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
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
                {i18n.t(k.EDITED)} {updatedAt && <TimeAgo time={updatedAt} />}
              </>
            ) : (
              <>{i18n.t(k.NO_UNPUBLISHED_EDITS)}</>
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
}
