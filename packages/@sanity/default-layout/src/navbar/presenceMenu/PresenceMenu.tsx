import client from 'part:@sanity/base/client'
import {UserAvatar} from '@sanity/base/components'
import {useGlobalPresence} from '@sanity/base/hooks'
import CogIcon from 'part:@sanity/base/cog-icon'
import UsersIcon from 'part:@sanity/base/users-icon'
import {AvatarStack} from 'part:@sanity/components/avatar'
import Button from 'part:@sanity/components/buttons/default'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import {Popover} from 'part:@sanity/components/popover'
import Escapable from 'part:@sanity/components/utilities/escapable'
import React, {useCallback, useState} from 'react'
import {PresenceListRow} from './PresenceListRow'

import styles from './PresenceMenu.css'

const MAX_AVATARS_GLOBAL = 4

export function PresenceMenu() {
  const {projectId} = client.config()
  const presence = useGlobalPresence()
  const [open, setOpen] = useState(false)

  const handleToggle = useCallback(() => setOpen(!open), [open])
  const handleClose = useCallback(() => setOpen(false), [])

  const popoverContent = (
    <div className={styles.popoverContent}>
      {presence.length === 0 && (
        <div className={styles.header}>
          <h2 className={styles.title}>No one else is here</h2>
          <p className={styles.subtitle}>
            Invite people to the project to see their online status.
          </p>
        </div>
      )}

      {presence.length > 0 && (
        <div className={styles.avatarList}>
          {presence.map((item) => (
            <PresenceListRow key={item.user.id} presence={item} onClose={handleClose} />
          ))}
        </div>
      )}

      <div className={styles.manageMembers}>
        <a
          href={`https://manage.sanity.io/projects/${projectId}/team`}
          className={styles.manageLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClose}
        >
          <span>Manage members</span>
          <CogIcon />
        </a>
      </div>
    </div>
  )

  return (
    <ClickOutside onClickOutside={handleClose}>
      {(ref) => (
        <div className={styles.root} ref={ref as React.Ref<HTMLDivElement>}>
          <Popover content={popoverContent as any} open={open}>
            <div>
              <Button
                className={styles.narrowButton}
                icon={UsersIcon}
                iconStatus={presence.length > 0 ? 'success' : undefined}
                kind="simple"
                onClick={handleToggle}
                padding="small"
                selected={open}
                tone="navbar"
              />

              <Button
                className={styles.wideButton}
                kind="simple"
                onClick={handleToggle}
                padding="small"
                selected={open}
                tone="navbar"
              >
                <AvatarStack
                  className={styles.avatarStack}
                  maxLength={MAX_AVATARS_GLOBAL}
                  tone="navbar"
                >
                  {presence.map((item) => (
                    <UserAvatar key={item.user.id} user={item.user} />
                  ))}
                </AvatarStack>
              </Button>
            </div>
          </Popover>

          {open && <Escapable onEscape={handleClose} />}
        </div>
      )}
    </ClickOutside>
  )
}
