// @todo: remove the following line when part imports has been removed from this file

import React from 'react'
import {Tooltip, Placement} from '@sanity/ui'
import {UserAvatar} from '../components/UserAvatar'
import type {FormFieldPresence} from './types'

import styles from './PresenceTooltip.css'

interface PresenceTooltipProps {
  children?: React.ReactElement
  items: FormFieldPresence[]
  placement?: Placement
}

export function PresenceTooltip(props: PresenceTooltipProps) {
  const {children, items, placement} = props

  const content = (
    <>
      {items.map((item) => (
        <div className={styles.item} key={item.user.id}>
          <div className={styles.avatarContainer}>
            <UserAvatar user={item.user} status="online" />
          </div>

          <div className={styles.textContainer}>
            <div className={styles.item__displayName}>{item.user.displayName}</div>
          </div>
        </div>
      ))}
    </>
  )

  return (
    <Tooltip content={content} placement={placement}>
      {children}
    </Tooltip>
  )
}
