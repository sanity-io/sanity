import {UserAvatar} from '@sanity/base/components'
import ChevronDownIcon from 'part:@sanity/base/chevron-down-icon'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
import {ClickOutside} from 'part:@sanity/components/click-outside'
import Menu from 'part:@sanity/components/menus/default'
import {Popover} from 'part:@sanity/components/popover'
import Escapable from 'part:@sanity/components/utilities/escapable'
import React from 'react'

import styles from './LoginStatus.css'

interface MenuItem {
  action: string
  icon: React.ComponentType<Record<string, unknown>>
  title: string
}

interface LoginStatusProps {
  onLogout: () => void
}

interface LoginStatusState {
  isOpen: boolean
}

export default class LoginStatus extends React.PureComponent<LoginStatusProps, LoginStatusState> {
  state = {isOpen: false}

  handleUserMenuItemClick = (item: MenuItem) => {
    if (item.action === 'signOut') {
      this.props.onLogout()
    }

    this.setState({isOpen: false})
  }

  handleButtonClick = () => {
    this.setState((state) => ({isOpen: !state.isOpen}))
  }

  handleClose = () => {
    this.setState({isOpen: false})
  }

  render() {
    const menuItems: MenuItem[] = [
      {
        title: `Sign out`,
        icon: IconSignOut,
        action: 'signOut',
      },
    ]

    const popoverContent = (
      <div className={styles.menuWrapper}>
        <Menu onAction={this.handleUserMenuItemClick} items={menuItems} />
      </div>
    )

    return (
      <ClickOutside onClickOutside={this.handleClose}>
        {(ref) => (
          <button
            className={styles.root}
            onClick={this.handleButtonClick}
            ref={ref as React.Ref<HTMLButtonElement>}
            title="Toggle user menu"
            type="button"
          >
            <div className={styles.inner} tabIndex={-1}>
              <Popover
                content={popoverContent as any}
                open={this.state.isOpen}
                placement="bottom-end"
              >
                <div className={styles.avatarContainer}>
                  <UserAvatar size="medium" tone="navbar" userId="me" />
                </div>
              </Popover>

              <div className={styles.iconContainer}>
                <ChevronDownIcon />
              </div>
            </div>

            {this.state.isOpen && <Escapable onEscape={this.handleClose} />}
          </button>
        )}
      </ClickOutside>
    )
  }
}
