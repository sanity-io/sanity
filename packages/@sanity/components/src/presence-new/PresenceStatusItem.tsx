import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/PresenceStatusItem.css'
import AvatarProvider from './AvatarProvider'
import {Status, User} from './types'
import {shortenName} from './helpers'

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
  sessions: Array<any>
}

export default function PresenceStatusItem({id, status, sessions}: Props) {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  const renderContent = () => {
    return (
      <div className={styles.inner}>
        <div className={styles.avatar}>
          <AvatarProvider size="medium" status={status} userId={id} sessionId={user.sessionId} />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.name}>{shortenName(user.displayName)}</div>
          <div>{status}</div>
        </div>
      </div>
    )
  }

  // TODO
  // Temp solution: Find first session with a document id to decide param for intent link
  const session = sessions.find(session => session.state && session.state.documentId)

  return (
    <div className={styles.root}>
      {session && session.state && session.state.documentId
        ? withIntent(renderContent, session.state.documentId)
        : renderContent()}
    </div>
  )
}

PresenceStatusItem.defaultProps = {
  status: 'inactive',
  sessions: []
} as Partial<Props>;
