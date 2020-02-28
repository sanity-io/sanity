import React from 'react'
import styles from './styles/Avatar.css'
import userStore from 'part:@sanity/base/user'

type Props = {
  imageUrl?: string
  id: string | null
  status: 'active' | 'inactive' | 'syncing' | 'pulse'
  dock: 'top' | 'bottom'
  initials: string
  color: string
}

export default function Avatar({
  imageUrl,
  id,
  status,
  dock,
  initials,
  color
}: Props): HTMLDivElement {
  // data-dock={dock}
  const [user, setUser] = React.useState(null)
  React.useEffect(() => {
    if (id) {
      userStore.getUser(id).then(user => {
        setUser(user)
      })
    }
  }, [user])
  console.log('user', user)
  return (
    <div className={styles.root} data-dock={dock}>
      {user && user.displayName}
      {/* <div className={styles.avatar} data-status={status} style={{borderColor: color}}>
        <div className={styles.inner}>
          <div className={styles.image} />
        </div>
      </div> */}
    </div>
  )
}
