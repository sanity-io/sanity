// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import {IntentLink} from 'part:@sanity/base/router'
import React from 'react'
import {Box, Tooltip} from '@sanity/ui'
import {
  unstable_useCheckDocumentPermission as useCheckDocumentPermission,
  useCurrentUser,
} from '../../../../hooks'
import {MediaDimensions} from '../types'
import {InsufficientPermissionsMessage} from '../../../../components'

import styles from './CreateDocumentPreview.css'

interface CreateDocumentPreviewProps {
  title?: React.ReactNode | React.FunctionComponent<unknown>
  subtitle?: React.ReactNode | React.FunctionComponent<{layout: 'default'}>
  description?: React.ReactNode | React.FunctionComponent<unknown>
  media?: React.ReactNode | React.FunctionComponent<unknown>
  icon?: React.ComponentType<unknown>
  isPlaceholder?: boolean
  params?: {
    intent: 'create'
    type: string
    template?: string
  }
  templateParams?: Record<string, unknown>
  onClick?: () => void
  mediaDimensions?: MediaDimensions
}

const DEFAULT_MEDIA_DIMENSION: MediaDimensions = {
  width: 80,
  height: 80,
  aspect: 1,
  fit: 'crop',
}

export default function CreateDocumentPreview(props: CreateDocumentPreviewProps) {
  const {
    title = 'Untitled',
    subtitle,
    media = props.icon,
    isPlaceholder,
    mediaDimensions = DEFAULT_MEDIA_DIMENSION,
    description,
    params,
    templateParams,
  } = props

  const {value: currentUser} = useCurrentUser()

  const createPermission = useCheckDocumentPermission('dummy-id', params.type, 'create')

  if (isPlaceholder || !params) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Loading…</h2>
          <h3 className={styles.subtitle}>Loading…</h3>
        </div>
        {media !== false && <div className={styles.media} />}
      </div>
    )
  }

  const content = (
    <>
      {media !== false && (
        <div className={styles.media}>
          {typeof media === 'function' && media({dimensions: mediaDimensions, layout: 'default'})}
          {typeof media === 'string' && <div className={styles.mediaString}>{media}</div>}
          {React.isValidElement(media) && media}
        </div>
      )}
      <div className={styles.heading}>
        <h2 className={styles.title}>
          {typeof title !== 'function' && title}
          {typeof title === 'function' && title({layout: 'default'})}
        </h2>
        {subtitle && (
          <h3 className={styles.subtitle}>
            {(typeof subtitle === 'function' && subtitle({layout: 'default'})) || subtitle}
          </h3>
        )}
      </div>
      {description && <p className={styles.description}>{description}</p>}
    </>
  )

  return createPermission.granted ? (
    <IntentLink
      intent="create"
      params={[params, templateParams]}
      className={styles.enabledRoot}
      title={subtitle ? `Create new ${title} (${subtitle})` : `Create new ${title}`}
      onClick={props.onClick}
    >
      {content}
    </IntentLink>
  ) : (
    <Tooltip
      content={
        <Box padding={2} style={{maxWidth: 300}}>
          <InsufficientPermissionsMessage
            currentUser={currentUser}
            operationLabel="create this document"
          />
        </Box>
      }
    >
      <div className={styles.disabledRoot}>{content}</div>
    </Tooltip>
  )
}
