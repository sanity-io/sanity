/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent} from 'react'
import {IntentLink} from 'part:@sanity/base/router'
import styles from './BlockObject.css'

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
  params
}): JSX.Element => {
  const Icon = icon
  const preventDefault = (event: SyntheticEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
  }
  return (
    <div
      className={color === 'danger' ? styles.menuItemDanger : styles.menuItem}
      onClick={preventDefault}
    >
      {intent ? (
        <IntentLink intent={intent} params={params}>
          {Icon && <Icon />}
          {title}
        </IntentLink>
      ) : (
        <>
          {Icon && <Icon />}
          &nbsp;
          {title}
        </>
      )}
    </div>
  )
}
