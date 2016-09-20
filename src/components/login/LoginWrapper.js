import React, {PropTypes} from 'react'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'

export default class LoginWrapper extends React.Component {

  static propTypes = {
    children: PropTypes.node.isRequired
  }

  constructor() {
    super()
    this.state = {}
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

  render() {
    return (
      <div>
        {this.state.user && this.props.children}
        {this.state.user === null && <LoginDialog/>}
      </div>
    )
  }
}
