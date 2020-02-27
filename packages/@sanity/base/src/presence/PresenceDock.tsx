import React from 'react'
import cx from 'classnames'
import styles from './styles/PresenceDock.css'
import Avatar from './Avatar'

type Props = {
  children: React.ReactNode
}

export default function PresenceDock({children}: Props): HTMLDivElement {
  const avatarsTop = [
    {
      status: 'active',
      dock: 'top',
      id: 'avatar1',
      initials: 'VB',
      color: 'blue'
    },
    {
      status: 'syncing',
      dock: 'top',
      id: 'avatar2',
      initials: 'PK',
      color: 'blue'
    },
    {
      status: 'inactive',
      dock: 'top',
      id: 'avatar3',
      initials: 'BB',
      color: 'blue'
    }
  ]
  const avatarsBottom = [
    {
      status: 'active',
      dock: 'bottom',
      id: 'avatar1',
      initials: 'VB',
      color: 'blue'
    },
    {
      status: 'syncing',
      dock: 'bottom',
      id: 'avatar2',
      initials: 'PK',
      color: 'blue'
    },
    {
      status: 'inactive',
      dock: 'bottom',
      id: 'avatar3',
      initials: 'BB',
      color: 'blue'
    }
  ]
  return (
    <div className={styles.root}>
      <div className={cx(styles.dock, styles.top)}>
        {avatarsTop.map(a => (
          <Avatar key={a.id} {...a} />
        ))}
      </div>
      {children}
      <div className={cx(styles.dock, styles.bottom)}>
        {avatarsBottom.map(a => (
          <Avatar key={a.id} {...a} />
        ))}
      </div>
    </div>
  )
}
