import React from 'react'
import styles from './styles/Avatar.css'

type Props = {
  imageUrl?: string
  id: string
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
  return (
    <div className={styles.root} data-dock={dock}>
      <div className={styles.avatar} data-status={status} style={{borderColor: color}}>
        <div className={styles.inner}>
          <div className={styles.image}>{/* <img src={imageUrl} alt={initials} /> */}</div>
        </div>
      </div>
    </div>
  )
}
