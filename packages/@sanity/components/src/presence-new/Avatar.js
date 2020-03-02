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

export default function Avatar({id, position, scrollToField}) {
  // data-dock={dock}
  const [user, setUser] = React.useState(null)
  React.useEffect(() => {
    if (id) {
      userStore.getUser(id).then(result => {
        setUser(result)
      })
    }
  }, [user])

  function handleScrollToField(event) {
    if (scrollToField) {
      scrollToField(event)
    }
  }

  return (
    <div className={styles.root} onClick={handleScrollToField} data-dock={position}>
      <div className={styles.avatar} data-status={status}>
        <div className={styles.inner}>
          <div className={styles.avatarImage}>
            {user && user.imageUrl && <img src={user.imageUrl} />}
          </div>
        </div>
      </div>
      <div className={styles.arrow} data-dock={position}>
        <svg viewBox="0 0 6 6">
          <path d="M0 6L3 0L6 6H4H2H0Z" />
        </svg>
      </div>
    </div>
  )
}

Avatar.propTypes = {
  id: PropTypes.string,
  position: PropTypes.string,
  scrollToField: PropTypes.func
}

Avatar.defaultProps = {
  id: null,
  position: null,
  scrollToField: null
}
