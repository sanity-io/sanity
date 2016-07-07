import React from 'react'
import styles from '../../styles/LoginStatus.css'
import userStore from 'datastore:@sanity/base/user'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import config from 'config:sanity'

export default class LoginStatus extends React.Component {

  constructor() {
    super()
    this.toggleLoginStatusMenu = this.toggleLoginStatusMenu.bind(this)
    this.handleLogoutButtonClicked = this.handleLogoutButtonClicked.bind(this)
    this.state = {user: null, menuVisible: false}
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

  toggleLoginStatusMenu() {
    this.setState({menuVisible: !this.state.menuVisible})
  }

  handleLogoutButtonClicked(evnt) {
    evnt.preventDefault()
    userStore.actions.logout()
  }

  render() {
    const user = this.state.user
    if (!user) {
      return null
    }
    return (
      <div className={styles.loginStatus}>
        <img onClick={this.toggleLoginStatusMenu} src={user.profileImage} className={styles.userImage} />
        {this.state.menuVisible && (
          <div style={{float: 'left'}}>
            <p>{user.name}</p>
            <p>
              <button onClick={this.handleLogoutButtonClicked}>
                <FormattedMessage id="logoutButtonText" />
              </button>
            </p>
          </div>
        )}
      </div>
    )
  }
}
