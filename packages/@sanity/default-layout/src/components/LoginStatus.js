import PropTypes from 'prop-types'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import Menu from 'part:@sanity/components/menus/default'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
import {Tooltip} from 'react-tippy'
import styles from './styles/LoginStatus.css'

class LoginStatus extends React.PureComponent {
  static propTypes = {
    className: PropTypes.string,
    onLogout: PropTypes.func,
    user: PropTypes.shape({
      name: PropTypes.string,
      profileImage: PropTypes.string
    })
  }

  handleUserMenuItemClick = item => {
    const {onLogout} = this.props
    if (item.action === 'signOut') {
      onLogout()
    }
  }

  render() {
    const {user} = this.props
    if (!user) {
      return null
    }

    let className = styles.root
    if (this.props.className) className += this.props.className
    return (
      <div className={className}>
        <Tooltip
          trigger="click"
          interactive
          arrow
          theme="light"
          html={
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
              />
            </div>
          }
        >
          <button className={styles.button} title="Show user menu" type="button">
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
        </Tooltip>
      </div>
    )
  }
}

export default enhanceClickOutside(LoginStatus)
