import React, {PropTypes} from 'react'
import styles from './styles/LoginStatus.css'
import userStore from 'part:@sanity/base/user'
import Menu from 'part:@sanity/components/menus/default'
import IconSignOut from 'part:@sanity/base/sign-out-icon'

export default class LoginStatus extends React.Component {
  static propTypes = {
    className: PropTypes.string
  }

  constructor(props, args) {
    super(props, args)
    this.state = {
      userMenuOpened: false
    }
  }

  componentWillMount() {
    this.userSubscription = userStore.currentUser
      .map(ev => ev.user)
      .subscribe(user => this.setState({user}))
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

        <div className={styles.userName}>{user.name}</div>

        {userMenuOpened && (
          <div className={styles.userMenu}>
            <Menu
              onAction={this.handleUserMenuItemClick}
              items={[{
                title: `Log out ${user.name}`,
                icon: IconSignOut,
                index: 'signOut'
              }]}
              opened
              origin="top-right"
              onClickOutside={this.handleUserMenuClose}
            />
          </div>
        )
        }
      </div>
    )
  }
}
