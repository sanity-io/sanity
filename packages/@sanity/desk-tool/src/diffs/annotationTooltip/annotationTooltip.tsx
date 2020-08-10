import React from 'react'
import {Tooltip} from 'react-tippy'
import {Annotation, AnnotationChanged} from '../../panes/documentPane/history/types'

import styles from './annotationTooltip.css'

interface AnnotationTooltipProps {
  annotation: Annotation
  children: React.ReactNode
}

export function AnnotationTooltip(props: AnnotationTooltipProps) {
  if (props.annotation.type === 'unchanged') {
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

function AnnotationTooltipContent(props: {annotation: AnnotationChanged}) {
  return (
    <div className={styles.root}>
      <UserItem userId={props.annotation.author} />
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
