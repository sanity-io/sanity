import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/PresenceStatusItem.css'
import AvatarProvider from './AvatarProvider'
import {Status, User} from './types'
import colorHasher from '../presence/colorHasher'

function withIntent(content: any, documentId: string) {
  return (
    <IntentLink className={styles.intentLink} intent="edit" params={{id: documentId}}>
      {content()}
    </IntentLink>
  )
}

type Props = {
  id: string
  status: Status
  sessions: any[]
}

const renderContent = ({id, user, status}: {id: string; user: User; status: Status}) => {
  return (
    <div className={styles.inner}>
      <div className={styles.avatar}>
        <AvatarProvider size="medium" status={status} userId={id} color={colorHasher(id)} />
      </div>
      <div className={styles.userInfo}>
        <span className={styles.name} title={user.displayName}>
          {user.displayName}
        </span>
      </div>
    </div>
  )
}

export default function PresenceStatusItem({id, status = 'inactive', sessions = []}: Props) {
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
  const session = sessions.find(session => session.state?.documentId)

  return (
    <div className={styles.root}>
      {session?.state?.documentId
        ? withIntent(() => renderContent({user, id, status}), session.state.documentId)
        : renderContent({user, id, status})}
    </div>
  )
}
