import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import SignOutIcon from 'part:@sanity/base/sign-out-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import DatasetSelect from '../datasetSelect/DatasetSelect'
import {HAS_SPACES} from '../../util/spaces'
import {Router, Tool, User} from '../../types'

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
  let className = styles.root
  if (isOpen) className += ` ${styles.isOpen}`
  const tabIndex = isOpen ? 0 : -1

  return (
    <div className={className}>
      <div>
        <button
          className={styles.closeButton}
          type="button"
          onClick={onClose}
          title="Close menu"
          tabIndex={tabIndex}
        >
          <CloseIcon />
        </button>

        <div className={styles.userProfile}>
          {user.profileImage ? (
            <img
              className={styles.userProfileImage}
              src={user.profileImage}
              alt={`${user.name}'s profile image`}
              data-initials={user.name ? user.name.charAt(0) : user.email.charAt(0)}
            />
          ) : (
            <div className={styles.userProfileImageMissing}>
              {user.name ? user.name.charAt(0) : user.email.charAt(0)}
            </div>
          )}
          <div className={styles.userProfileText}>{user.name || user.email}</div>
        </div>

        {HAS_SPACES && (
          <div className={styles.datasetSelectContainer}>
            <DatasetSelect isVisible={isOpen} />
          </div>
        )}

        <div className={styles.toolSwitcher}>
          <ToolSwitcher
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
            <a onClick={onSignOut} tabIndex={tabIndex}>
              <span className={styles.signOutButtonIconContainer}>
                <SignOutIcon />
              </span>
              <span className={styles.signOutButtonText}>Sign out</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

SideMenu.defaultProps = {
  activeToolName: null
}

export default SideMenu
