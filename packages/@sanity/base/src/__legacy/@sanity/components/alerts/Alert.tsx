import classNames from 'classnames'
import React from 'react'

import styles from './Alert.css'

interface Props {
  children?: React.ReactNode
  color?: 'success' | 'warning' | 'danger'
  icon?: React.ComponentType
  title?: React.ReactNode
}

export default function Alert(props: Props) {
  const {children, color, icon, title} = props

  return (
    <div className={classNames(styles.root, color && styles[`color_${color}`])}>
      {icon && <div className={styles.iconContainer}>{React.createElement(icon)}</div>}
      {(title || children) && (
        <div className={styles.content}>
          {title && <h4 className={styles.title}>{title}</h4>}
          <div className={styles.description}>{children}</div>
        </div>
      )}
    </div>
  )
}
