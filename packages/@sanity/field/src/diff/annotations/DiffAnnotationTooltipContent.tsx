import React from 'react'
import {useUser} from '@sanity/base/hooks'
import {UserAvatar} from '@sanity/base/components'
import {AnnotationDetails} from '../types'
import styles from './DiffAnnotationTooltipContent.css'

export function DiffAnnotationTooltipContent(props: {annotation: AnnotationDetails}) {
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
