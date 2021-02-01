/* eslint-disable react/prop-types */
import React, {FunctionComponent} from 'react'
import {IntentLink} from '../../../../legacyParts'

import styles from './BlockObjectMenuItem.css'

// This component renders the dropdown button menu on the block object's preview

export type DropDownMenuItemProps = {
  title: string
  icon: React.ComponentType
  color?: string
  intent?: 'edit' | string
  params?: Record<string, any>
  name?: string
}

export const MenuItem: FunctionComponent<DropDownMenuItemProps> = ({
  title,
  color,
  icon,
  intent,
  params,
}): JSX.Element => {
  const Icon = icon
  return (
    <div className={color === 'danger' ? styles.menuItemDanger : styles.menuItem}>
      {intent ? (
        <IntentLink className={styles.intentLink} intent={intent} params={params}>
          <div className={styles.iconContainer}>{Icon && <Icon />}</div>
          <div className={styles.title}>{title}</div>
        </IntentLink>
      ) : (
        <>
          <div className={styles.iconContainer}>{Icon && <Icon />}</div>
          <div className={styles.title}>{title}</div>
        </>
      )}
    </div>
  )
}
