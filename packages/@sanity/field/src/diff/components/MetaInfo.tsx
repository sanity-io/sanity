import React from 'react'
import styles from './MetaInfo.css'

interface MetaInfoProps {
  title: string
  action?: string
  icon?: any
  children?: React.ReactNode
  markRemoved?: boolean
}

export function MetaInfo({
  title,
  action,
  icon,
  children,
  markRemoved,
}: MetaInfoProps): React.ReactElement {
  const Icon = icon
  const iconClass = markRemoved ? styles.iconRemoved : styles.icon
  const titleClass = markRemoved ? styles.titleRemoved : styles.title
  return (
    <div className={styles.root}>
      {icon && (
        <div className={iconClass}>
          <Icon />
        </div>
      )}
      <div className={styles.info}>
        <h3 className={titleClass} title={title}>
          {title}
        </h3>
        {action && <div>{action}</div>}
        <div className={styles.children}>{children}</div>
      </div>
    </div>
  )
}
