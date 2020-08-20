import React from 'react'
import {Tooltip} from 'react-tippy'
import {useUser} from '@sanity/base/hooks'
import {Annotation, AnnotationDetails} from '@sanity/field/diff'
import UserAvatar from '@sanity/components/lib/presence/UserAvatar'

import styles from './annotationTooltip.css'

interface AnnotationTooltipProps {
  annotation: Annotation
  children: React.ReactNode
}

export function AnnotationTooltip(props: AnnotationTooltipProps) {
  if (!props.annotation) {
    return <>{props.children}</>
  }

  return (
    <Tooltip
      useContext
      arrow
      html={<AnnotationTooltipContent annotation={props.annotation} />}
      position="top"
      theme="light"
    >
      {props.children}
    </Tooltip>
  )
}

function AnnotationTooltipContent(props: {annotation: AnnotationDetails}) {
  return (
    <div className={styles.root}>
      <UserItem userId={props.annotation.author} />
    </div>
  )
}

function UserItem(props: {userId: string}) {
  const {isLoading, error, value: user} = useUser(props.userId)

  // @todo handle?
  if (error) {
    return null
  }

  return (
    <div className={styles.userItem}>
      {isLoading && 'Loading…'}
      {user && (
        <>
          <span>
            <UserAvatar user={user} />
          </span>
          <span>{user.displayName}</span>
        </>
      )}
    </div>
  )
}
