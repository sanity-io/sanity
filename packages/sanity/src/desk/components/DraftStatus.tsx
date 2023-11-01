import React from 'react'
import {EditIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {deskLocaleNamespace} from '../i18n'
import {TextWithTone, Translate, useTranslation, RelativeTime} from 'sanity'

export function DraftStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt
  const {t} = useTranslation(deskLocaleNamespace)

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <Translate
                i18nKey="pane-item.draft-status.has-draft.tooltip"
                t={t}
                components={{
                  RelativeTime: () => (
                    <>{updatedAt && <RelativeTime time={updatedAt} useTemporalPhrase />}</>
                  ),
                }}
              />
            ) : (
              t('pane-item.draft-status.no-draft.tooltip')
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
