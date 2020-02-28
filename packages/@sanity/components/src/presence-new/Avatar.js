import React from 'react'
import userStore from 'part:@sanity/base/user'
import PropTypes from 'prop-types'
import styles from './styles/Avatar.css'

// type Props = {
//   imageUrl?: string
//   id: string | null
//   status: 'active' | 'inactive' | 'syncing' | 'pulse'
//   dock: 'top' | 'bottom'
//   initials: string
//   color: string
// }

export default function Avatar({id, dock}) {
  // data-dock={dock}
  const [user, setUser] = React.useState(null)
  React.useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])
  return (
    <div className={styles.root} data-dock={dock}>
      <div className={styles.avatar} data-status={status}>
        <div className={styles.inner}>
          <div className={styles.avatarImage}>
            {user && user.imageUrl && <img src={user.imageUrl} />}
          </div>
        </div>
      </div>
    </div>
  )
}

Avatar.propTypes = {
  id: PropTypes.string,
  dock: PropTypes.string
}

Avatar.defaultProps = {
  id: null,
  dock: null
}
