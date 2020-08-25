import classNames from 'classnames'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import Menu from 'part:@sanity/components/menus/default'
import {Popover} from 'part:@sanity/components/popover'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
import styles from './LoginStatus.css'

interface Props {
  className: string
  onLogout: () => void
  user: {
    email: string
    name?: string
    profileImage?: string
  }
}

interface State {
  isOpen: boolean
}

class LoginStatus extends React.PureComponent<Props, State> {
  static defaultProps = {
    className: undefined,
    onLogout: undefined,
    user: undefined
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
    const {user} = this.props

    if (!user) return null

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
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  className={styles.userImage}
                  alt={`${user.name}'s profile image`}
                  data-initials={(user.name || user.email || '?').charAt(0)}
                />
              ) : (
                <div className={styles.userImageMissing}>
                  {user.name ? user.name.charAt(0) : user.email.charAt(0)}
                </div>
              )}
            </div>
          </button>
        </Popover>
      </div>
    )
  }
}

export default enhanceClickOutside(LoginStatus)
