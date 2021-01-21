import {UserAvatar, useZIndex} from '@sanity/base/components'
import {Layer} from '@sanity/ui'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import SignOutIcon from 'part:@sanity/base/sign-out-icon'
import Button from 'part:@sanity/components/buttons/default'
import ToolMenu from 'part:@sanity/default-layout/tool-switcher'
import {DatasetSelect} from '../components'
import {Router, Tool, User} from '../types'
import {HAS_SPACES} from '../util/spaces'

import styles from './SideMenu.css'

interface Props {
  activeToolName: string | null
  isOpen: boolean
  onClose: () => void
  onSignOut: () => void
  onSwitchTool: () => void
  router: Router
  tools: Tool[]
  user: User
}

function SideMenu(props: Props) {
  const {activeToolName, isOpen, onClose, onSignOut, onSwitchTool, router, tools, user} = props
  const zindex = useZIndex()
  let className = styles.root
  if (isOpen) className += ` ${styles.isOpen}`
  const tabIndex = isOpen ? 0 : -1

  return (
    <Layer className={className} zOffset={zindex.drawer}>
      <div>
        <div className={styles.header}>
          <div className={styles.headerMain}>
            <div className={styles.userProfile}>
              <div className={styles.userAvatarContainer}>
                <UserAvatar size="medium" userId="me" />
              </div>
              <div className={styles.userProfileText}>{user.name || user.email}</div>
            </div>

            <div className={styles.closeButtonContainer}>
              <Button
                icon={CloseIcon}
                kind="simple"
                onClick={onClose}
                padding="small"
                tabIndex={tabIndex}
                title="Close menu"
              />
            </div>
          </div>

          {HAS_SPACES && (
            <div className={styles.datasetSelectContainer}>
              <DatasetSelect isVisible={isOpen} />
            </div>
          )}
        </div>

        <div className={styles.toolSwitcher}>
          <ToolMenu
            activeToolName={activeToolName}
            direction="vertical"
            isVisible={isOpen}
            onSwitchTool={onSwitchTool}
            router={router}
            tools={tools}
          />
        </div>

        <div className={styles.menuBottom}>
          <div className={styles.signOutButton}>
            <Button icon={SignOutIcon} kind="simple" onClick={onSignOut} tabIndex={tabIndex}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </Layer>
  )
}

export default SideMenu
