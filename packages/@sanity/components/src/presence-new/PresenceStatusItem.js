import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/PresenceStatusItem.css'
import AvatarProvider from './AvatarProvider'

function withIntent(content, documentId) {
  return (
    <IntentLink className={styles.intentLink} intent="edit" params={{id: documentId}}>
      {content()}
    </IntentLink>
  )
}

export default function PresenceStatusItem({id, status, sessions = []}) {
  const [user, setUser] = useState({displayName: ''})

  useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  // Decide whether to show full name or only firstname with an initial
  const displayName = name => {
    const length = name.split('').length
    if (length > 18) {
      const nameArray = name.split(' ')
      return `${nameArray[0]} ${nameArray[nameArray.length - 1].charAt(0)}.`
    }
    return name
  }

  const renderContent = () => {
    return (
      <div className={styles.inner}>
        <div className={styles.avatar}>
          <AvatarProvider size="medium" status={status} userId={id} sessionId={user.sessionId} />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.name}>{displayName(user.displayName)}</div>
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

PresenceStatusItem.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['online', 'editing', 'inactive']),
  sessions: PropTypes.array
}

PresenceStatusItem.defaultProps = {
  status: 'inactive',
  sessions: []
}
