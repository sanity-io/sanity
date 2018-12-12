import PropTypes from 'prop-types'
import React from 'react'
import enhanceClickOutside from 'react-click-outside'
import Menu from 'part:@sanity/components/menus/default'
import IconSignOut from 'part:@sanity/base/sign-out-icon'
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

  constructor(...args) {
    super(...args)
    this.state = {
      userMenuOpened: false
    }
  }

  handleClickOutside = () => {
    if (this.state.userMenuOpened) {
      this.setState({userMenuOpened: false})
    }
  }

  handleUserMenuToggle = () => {
    this.setState({userMenuOpened: !this.state.userMenuOpened})
  }

  handleUserMenuItemClick = item => {
    const {onLogout} = this.props
    if (item.action === 'signOut') {
      onLogout()
    }
  }

  render() {
    const {user} = this.props
    const {userMenuOpened} = this.state
    if (!user) {
      return null
    }

    let className = styles.root
    if (this.props.className) className += this.props.className
    return (
      <div className={className}>
        <button
          className={styles.button}
          onClick={this.handleUserMenuToggle}
          title="Show user menu"
          type="button"
        >
          <div className={styles.inner} tabIndex={-1}>
            <img
              src={user.profileImage}
              className={styles.userImage}
              alt={`${user.name}'s profile image`}
            />
          </div>
        </button>

        <div className={styles.userName}>{user.name}</div>

        {userMenuOpened && (
          <div className={styles.userMenu}>
            <Menu
              onAction={this.handleUserMenuItemClick}
              items={[
                {
                  title: `Log out ${user.name}`,
                  icon: IconSignOut,
                  action: 'signOut'
                }
              ]}
              origin="top-right"
              onClickOutside={this.handleUserMenuClose}
            />
          </div>
        )}
      </div>
    )
  }
}

export default enhanceClickOutside(LoginStatus)
