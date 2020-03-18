import React from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import styles from './styles/CollaboratorItem.css'
import Avatar from './Avatar'

export default function CollaboratorItem({id, status}) {
  const [user, setUser] = React.useState({displayName: ''})
  React.useEffect(() => {
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
          <div className={styles.status}>{status}</div>
        </div>
      </div>
    </div>
  )
}

CollaboratorItem.propTypes = {
  id: PropTypes.string.isRequired,
  status: PropTypes.string
}

CollaboratorItem.defaultProps = {
  status: 'offline'
}
