import React from 'react'
import styles from './MetaInfo.css'

interface MetaInfoProps {
  title: string
  action?: string
  icon?: any
  children?: any
}

export function MetaInfo({title, action, icon, children}: MetaInfoProps) {
  const Icon = icon
  return (
    <div className={styles.root} data-action={action}>
      {icon && (
        <div className={styles.icon}>
          <Icon />
        </div>
      )}
      <div className={styles.info}>
        <h3 className={styles.title} title={title}>
          {title}
        </h3>
        {action && <div>{action}</div>}
        {children && children}
      </div>
    </div>
  )
}
