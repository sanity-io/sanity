import React, {useEffect, useState} from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './styles/CollaboratorItem.css'
import Avatar from './Avatar'

export default function CollaboratorItem({id, status, sessions}) {
  const [user, setUser] = useState({displayName: ''})

  useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  return (
    <div className={styles.root}>
      <div className={styles.inner}>
        <div className={styles.avatar}>
          <Avatar id={id} status={status} size="medium" />
        </div>
        <div className={styles.userInfo}>
          <div className={styles.name}>{user.displayName}</div>
          <ul className={styles.sessions}>
            {sessions.map(session => {
              return session.state && session.state.documentId ? (
                <li className={styles.location} key={session.clientId}>
                  <IntentLink
                    className={styles.intentLink}
                    intent="edit"
                    params={{id: session.state.documentId}}
                  >
                    <span className={styles.locationLabel}>In: </span>
                    <span className={styles.location}>{session.state.documentId}</span>
                  </IntentLink>
                </li>
              ) : (
                <li className={styles.status} key={session.clientId}>
                  {status}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}

CollaboratorItem.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['online', 'editing', 'inactive']),
  sessions: PropTypes.array
}

CollaboratorItem.defaultProps = {
  status: 'inactive',
  sessions: []
}
