import React from 'react'
import {useUser, LOADING_USER} from '@sanity/react-hooks'
import {Tooltip} from 'react-tippy'
import {UserAvatar} from '@sanity/components/presence'
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
  const user = useUser(props.userId)
  return (
    <div className={styles.userItem}>
      {user && user !== LOADING_USER ? <UserAvatar user={user} /> : '…'}
    </div>
  )
}
