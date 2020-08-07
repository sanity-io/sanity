import React from 'react'
import {Tooltip} from 'react-tippy'
import {Annotation} from '../../../panes/documentPane/history/types'

import styles from './annotationTooltip.css'

interface AnnotationTooltipProps {
  annotation: Annotation
  children: React.ReactNode
}

export function AnnotationTooltip(props: AnnotationTooltipProps) {
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

function AnnotationTooltipContent(props: {annotation: Annotation}) {
  const userIds: string[] = Array.from(props.annotation.authors)

  return (
    <div className={styles.root}>
      {userIds.map(userId => (
        <UserItem key={userId} userId={userId} />
      ))}
    </div>
  )
}

function UserItem(props: {userId: string}) {
  return (
    <div className={styles.userItem}>
      <code>userId={props.userId}</code>
    </div>
  )
}
