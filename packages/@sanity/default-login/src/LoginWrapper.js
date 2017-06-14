import PropTypes from 'prop-types'
import React from 'react'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'
import UnauthorizedUser from './UnauthorizedUser'
import ErrorDialog from './ErrorDialog'
import Spinner from 'part:@sanity/components/loading/spinner'

export default class LoginWrapper extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired
  }

  state = {isLoading: true, user: null, error: null}

  componentWillMount() {
    this.userSubscription = userStore.currentUser
      .subscribe({
        next: evt => this.setState({user: evt.user, error: evt.error, isLoading: false}),
        error: error => this.setState({error, isLoading: false})
      })
  }

  componentWillUnmount() {
    this.userSubscription.unsubscribe()
  }

  handleRetry = () => {
    this.setState({error: null, isLoading: true})
    userStore.actions.retry()
  }

  render() {
    const {error, user, isLoading} = this.state

    if (isLoading) {
      return <Spinner fullscreen />
    }

    if (error) {
      return <ErrorDialog onRetry={this.handleRetry} error={error} />
    }

    if (!user) {
      return <LoginDialog />
    }

    if (!user.role) {
      return <UnauthorizedUser user={user} />
    }

    return this.props.children
  }
}
