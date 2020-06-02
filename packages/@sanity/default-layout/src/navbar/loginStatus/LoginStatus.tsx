import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import Menu from 'part:@sanity/components/menus/default'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
import styles from './LoginStatus.css'
import {Tooltip} from 'react-tippy'

interface Props {
  className: string
  onLogout: () => void
  user: {
    email: string
    name?: string
    profileImage?: string
  }
}

class LoginStatus extends React.PureComponent<Props> {
  static defaultProps = {
    className: undefined,
    onLogout: undefined,
    user: undefined
  }

  constructor(props: Props) {
    super(props)
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
          distance={1}
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
                origin="top-right"
                onClickOutside={() => {}}
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
