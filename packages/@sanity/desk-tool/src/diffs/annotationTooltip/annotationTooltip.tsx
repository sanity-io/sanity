import React from 'react'
import {useUser} from '@sanity/react-hooks'
import {Tooltip} from 'react-tippy'
import {UserAvatar} from '@sanity/components/presence'
import {Annotation, AnnotationDetails} from '../../panes/documentPane/history/types'

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
          <UserAvatar user={user} /> {user.displayName}
        </>
      )}
    </div>
  )
}
