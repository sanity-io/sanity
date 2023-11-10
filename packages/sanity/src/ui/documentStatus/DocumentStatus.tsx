import {EditIcon, PublishIcon} from '@sanity/icons'
import {PreviewValue, SanityDocument} from '@sanity/types'
import {ButtonTone} from '@sanity/ui'
import React from 'react'
import {Tooltip} from '..'
import {TextWithTone, useTimeAgo} from 'sanity'

type DocumentStatusType = 'draft' | 'published'

interface DocumentStatusTypeOptions {
  activePrefix: string
  icon: React.ComponentType
  tone: ButtonTone
  inactiveMessage: string
}

const DOCUMENT_STATUS: Record<DocumentStatusType, DocumentStatusTypeOptions> = {
  draft: {
    activePrefix: 'Edited',
    icon: EditIcon,
    tone: 'caution',
    inactiveMessage: 'No published edits',
  },
  published: {
    activePrefix: 'Published',
    icon: PublishIcon,
    tone: 'positive',
    inactiveMessage: 'Not published',
  },
}

export interface DocumentStatusProps {
  document?: PreviewValue | Partial<SanityDocument> | null
  type: DocumentStatusType
}

export function DocumentStatus({document, type}: DocumentStatusProps) {
  const updatedAt = document && '_updatedAt' in document && document._updatedAt

  const lastUpdatedTimeAgo = useTimeAgo(updatedAt || '', {minimal: true, agoSuffix: true})
  const label = updatedAt
    ? `${DOCUMENT_STATUS[type].activePrefix} ${lastUpdatedTimeAgo}`
    : DOCUMENT_STATUS[type].inactiveMessage
  const Icon = DOCUMENT_STATUS[type].icon

  return (
    <Tooltip content={label} portal>
      <TextWithTone tone={DOCUMENT_STATUS[type].tone} size={1} dimmed={!document} muted={!document}>
        <Icon aria-label={label} />
      </TextWithTone>
    </Tooltip>
  )
}
