import React from 'react'
import {useUser, useTimeAgo} from '@sanity/base/hooks'
import {UserAvatar} from '@sanity/base/components'
import {AnnotationDetails} from '../../types'
import {useAnnotationColor} from './hooks'
import styles from './DiffAnnotationTooltipContent.css'

export function DiffAnnotationTooltipContent({
  annotations,
  description = 'Changed by'
}: {
  annotations: AnnotationDetails[]
  description?: React.ReactNode | string
}) {
  return (
    <div className={styles.root}>
      {typeof description === 'string' ? (
        <span className={styles.description}>{description}</span>
      ) : (
        description
      )}

      {annotations.map(annotation => (
        <AnnotationItem key={annotation.author} annotation={annotation} />
      ))}
    </div>
  )
}

function AnnotationItem({annotation}: {annotation: AnnotationDetails}) {
  const {author, timestamp} = annotation
  const color = useAnnotationColor(annotation)
  const {error, value: user} = useUser(author)
  const timeAgo = useTimeAgo(timestamp, {minimal: true})

  // @todo handle?
  if (error) {
    return null
  }

  return (
    <div className={styles.annotation}>
      <div className={styles.user} style={{backgroundColor: color.background, color: color.text}}>
        <span className={styles.avatarContainer}>
          <UserAvatar userId={author} />
        </span>
        <span className={styles.displayName}>{user ? user.displayName : 'Loading…'}</span>
      </div>
      <time className={styles.timeAgo} dateTime={timestamp}>
        {timeAgo}
      </time>
    </div>
  )
}
