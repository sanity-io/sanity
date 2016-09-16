import React, {PropTypes} from 'react'
import styles from '../../styles/LoginStatus.css'
import userStore from 'datastore:@sanity/base/user'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import Menu from 'component:@sanity/components/menus/default'
import IconSignOut from 'icon:@sanity/sign-out'
// import config from 'config:sanity'

export default class LoginStatus extends React.Component {

  static propTypes = {
    className: PropTypes.string
  }

  state = {
    userMenuOpened: false
  }

  componentWillMount() {
    this.userSubscription = userStore.currentUser
      .map(ev => ev.user)
      .subscribe(user => {
        this.setState({user: user})
      })
  }

  componentWillUnmount() {
    this.userSubscription.unsubscribe()
  }

  handleUserMenuClose = () => {
    this.setState({
      userMenuOpened: false
    })
  }

  handleUserMenuOpen = () => {
    this.setState({
      userMenuOpened: true
    })
  }

  handleUserMenuItemClick = item => {
    if (item.index == 'signOut') {
      userStore.actions.logout()
    }
  }

  render() {
    const {className} = this.props
    const {user, userMenuOpened} = this.state
    if (!user) {
      return null
    }
    return (
      <div className={`${styles.root} ${className}`}>

        <div onClick={this.handleUserMenuOpen}>
          <img src={user.profileImage} className={styles.userImage} />
        </div>

        {
          userMenuOpened
          && <div className={styles.userMenu}>
            <Menu
              onAction={this.handleUserMenuItemClick}
              items={[
                {
                  title: `Log out ${user.name}`,
                  icon: IconSignOut,
                  index: 'signOut'
                }
              ]}
              opened
              origin="top-right"
              onClickOutside={this.handleUserMenuClose}
            />
          </div>
        }
      </div>
    )
  }
}
