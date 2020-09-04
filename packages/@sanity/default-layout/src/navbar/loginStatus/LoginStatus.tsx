import classNames from 'classnames'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import {UserAvatar} from '@sanity/base/components'
import Menu from 'part:@sanity/components/menus/default'
import {Popover} from 'part:@sanity/components/popover'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
import styles from './LoginStatus.css'

interface Props {
  className: string
  onLogout: () => void
}

interface State {
  isOpen: boolean
}

class LoginStatus extends React.PureComponent<Props, State> {
  static defaultProps = {
    className: undefined,
    onLogout: undefined
  }

  state = {isOpen: false}

  handleUserMenuItemClick = item => {
    if (item.action === 'signOut') {
      this.props.onLogout()
    }

    this.setState({isOpen: false})
  }

  handleAvatarClick = () => {
    if (!this.state.isOpen) {
      this.setState({isOpen: true})
    }
  }

  handleUserMenuClickOutside = () => {
    this.setState({isOpen: false})
  }

  render() {
    return (
      <div className={classNames(styles.root, this.props.className)}>
        <Popover
          content={
            <div className={styles.menuWrapper}>
              <Menu
                onAction={this.handleUserMenuItemClick}
                items={[
                  {
                    title: `Sign out`,
                    icon: IconSignOut,
                    action: 'signOut'
                  }
                ]}
                origin="top-right"
                onClickOutside={this.handleUserMenuClickOutside}
              />
            </div>
          }
          open={this.state.isOpen}
          placement="bottom-end"
        >
          <button
            className={styles.button}
            onClick={this.handleAvatarClick}
            title="Show user menu"
            type="button"
          >
            <div className={styles.inner} tabIndex={-1}>
              <UserAvatar size="medium" tone="navbar" userId="me" />
            </div>
          </button>
        </Popover>
      </div>
    )
  }
}

export default enhanceClickOutside(LoginStatus)
