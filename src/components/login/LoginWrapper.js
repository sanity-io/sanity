import React, {PropTypes} from 'react'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'

export default class LoginWrapper extends React.Component {

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
    return this.state.user ? this.props.children : <LoginDialog />
  }
}
