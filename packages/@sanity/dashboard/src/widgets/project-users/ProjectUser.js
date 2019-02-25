import React from 'react'
import PropTypes from 'prop-types'
import ToolIcon from 'react-icons/lib/go/tools'
import styles from './ProjectUser.css'

ProjectUser.propTypes = {
  user: PropTypes.object.isRequired,
  membership: PropTypes.object.isRequired
}

export default function ProjectUser(props) {
  const {user, membership} = props

  return (
    <div className={styles.container}>
      {membership.isRobot ? (
        <ToolIcon className={styles.profileImage} />
      ) : (
        <img className={styles.profileImage} src={user.imageUrl} />
      )}
      <span className={styles.name}>{user.displayName}</span>
      <span className={styles.role}>[{membership.role}]</span>
    </div>
  )
}
