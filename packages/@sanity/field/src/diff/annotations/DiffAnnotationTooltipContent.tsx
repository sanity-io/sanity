import React from 'react'
import {useUser, useTimeAgo} from '@sanity/base/hooks'
import {UserAvatar} from '@sanity/base/components'
import {useUserColorManager} from '@sanity/base/user-color'
import {AnnotationDetails} from '../../types'
import styles from './DiffAnnotationTooltipContent.css'
import {getAnnotationColor} from './helpers'

export function DiffAnnotationTooltipContent({
  annotations,
  description = 'Changed'
}: {
  annotations: AnnotationDetails[]
  description?: React.ReactNode
}): React.ReactElement {
  return (
    <div className={styles.root}>
      <div className={styles.description}>{description}</div>

      {annotations.map(annotation => (
        <AnnotationItem key={annotation.author} annotation={annotation} />
      ))}
    </div>
  )
}

function AnnotationItem({annotation}: {annotation: AnnotationDetails}) {
  const {author, timestamp} = annotation
  const userColorManager = useUserColorManager()
  const {error, value: user} = useUser(author)
  const color = getAnnotationColor(userColorManager, annotation)
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
