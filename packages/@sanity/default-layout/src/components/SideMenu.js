import PropTypes from 'prop-types'
import React from 'react'
import CloseIcon from 'part:@sanity/base/close-icon'
import SignOutIcon from 'part:@sanity/base/sign-out-icon'
import ToolSwitcher from 'part:@sanity/default-layout/tool-switcher'
import {HAS_SPACES} from '../util/spaces'
import SpaceSwitcher from './SpaceSwitcher'

import styles from './styles/SideMenu.css'

function SideMenu(props) {
  const {activeToolName, isOpen, onClose, onSignOut, onSwitchTool, tools, user} = props
  let className = styles.root
  if (isOpen) className += ` ${styles.isOpen}`
  const tabIndex = isOpen ? '0' : '-1'

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
          <div className={styles.userProfileImage}>
            <img src={user.profileImage} alt={`${user.name}'s profile image`} />
          </div>
          <div className={styles.userProfileText}>{user.name}</div>
        </div>

        {HAS_SPACES && (
          <div className={styles.spaceSwitcher}>
            <SpaceSwitcher isVisible={isOpen} />
          </div>
        )}

        <div className={styles.toolSwitcher}>
          <ToolSwitcher
            activeToolName={activeToolName}
            direction="vertical"
            isVisible={isOpen}
            onSwitchTool={onSwitchTool}
            tools={tools}
          />
        </div>

        <div className={styles.menuBottom}>
          <div className={styles.signOutButton}>
            <a onClick={onSignOut} tabIndex={tabIndex}>
              <span className={styles.signOutButtonIconContainer}>
                <SignOutIcon />
              </span>{' '}
              <span className={styles.signOutButtonText}>Sign out</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

SideMenu.propTypes = {
  activeToolName: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  onSwitchTool: PropTypes.func.isRequired,
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string
    })
  ).isRequired,
  user: PropTypes.shape({
    profileImage: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
}

export default SideMenu
