import classNames from 'classnames'
import React from 'react'

import styles from './Alert.css'

interface Props {
  children?: React.ReactNode
  color?: 'success' | 'warning' | 'danger'
  icon?: React.ComponentType
}

export default function Alert(props: Props) {
  const {children, color, icon} = props

  return (
    <div className={classNames(styles.root, color && styles[`color_${color}`])}>
      {icon && <div className={styles.iconContainer}>{React.createElement(icon)}</div>}
      {children && <div className={styles.content}>{children}</div>}
    </div>
  )
}
