/* eslint-disable react/no-multi-comp */
import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './ListItem.css'
import AvatarProvider from './AvatarProvider'
import {Status, User, Size} from './types'

function withIntent(onClick: () => void, content: any, documentId: string) {
  return (
    <IntentLink
      className={styles.intentLink}
      intent="edit"
      params={{id: documentId}}
      onClick={onClick}
    >
      <div className={styles.intentInner}>{content()}</div>
    </IntentLink>
  )
}

type Props = {
  id: string
  status: Status
  sessions?: any[]
  size?: Size
  onClick?: () => void
}

const renderContent = ({
  id,
  user,
  status,
  size
}: {
  id: string
  user: User
  status: Status
  size: Size
}) => {
  return (
    <div className={styles.inner} data-size={size}>
      <div className={styles.avatar}>
        <AvatarProvider size={size} status={status} userId={id} />
      </div>
      <div className={styles.userInfo}>
        <span className={styles.name} title={user.displayName}>
          {user.displayName}
        </span>
      </div>
    </div>
  )
}

export default function ListItem({
  id,
  status = 'inactive',
  sessions,
  size = 'medium',
  onClick
}: Props) {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  if (!user) {
    return null
  }

  // TODO
  // Temp solution: Find first session with a document id to decide param for intent link
  const session = sessions && sessions.find(session => session.state?.documentId)
  return (
    <div className={styles.root}>
      {session?.state?.documentId
        ? withIntent(
            onClick,
            () => renderContent({user, id, status, size}),
            session.state.documentId
          )
        : renderContent({user, id, status, size})}
    </div>
  )
}
