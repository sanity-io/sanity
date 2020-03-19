import React from 'react'
import PropTypes from 'prop-types'
import styles from './styles/CollaboratorList.css'
import CollaboratorItem from './CollaboratorItem'

export default function CollaboratorList({users}) {
  return (
    <ul className={styles.root}>
      {users.map(user => (
        <li key={user.identity}>
          <CollaboratorItem id={user.identity} status={user.status} sessions={user.sessions} />
        </li>
      ))}
    </ul>
  )
}

CollaboratorList.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      identity: PropTypes.string,
      status: PropTypes.string
    })
  ).isRequired
}
