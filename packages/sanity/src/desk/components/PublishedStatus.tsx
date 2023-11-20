import React from 'react'
import {PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {Box, Text, Tooltip} from '@sanity/ui'
import {structureLocaleNamespace} from '../i18n'
import {RelativeTime, TextWithTone, Translate, useTranslation} from 'sanity'

export function PublishedStatus(props: {document?: PreviewValue | Partial<SanityDocument> | null}) {
  const {document} = props
  const updatedAt = document && '_updatedAt' in document && document._updatedAt
  const statusLabel = document ? 'Published' : 'Not published'
  const {t} = useTranslation(structureLocaleNamespace)

  return (
    <Tooltip
      portal
      content={
        <Box padding={2}>
          <Text size={1}>
            {document ? (
              <Translate
                t={t}
                i18nKey="pane-item.published-status.has-published.tooltip"
                components={{
                  RelativeTime: () => (
                    <>{updatedAt && <RelativeTime time={updatedAt} useTemporalPhrase />}</>
                  ),
                }}
              />
            ) : (
              t('pane-item.published-status.no-published.tooltip')
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
