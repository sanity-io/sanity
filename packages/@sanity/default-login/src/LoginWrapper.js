import React, {PropTypes} from 'react'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'
import UnauthorizedUser from './UnauthorizedUser'

export default class LoginWrapper extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired
  }

  state = {user: null}

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

  render() {
    const user = this.state.user
    if (!user) {
      return <LoginDialog />
    }

    if (!user.role) {
      return <UnauthorizedUser user={user} />
    }

    return this.props.children
  }
}
