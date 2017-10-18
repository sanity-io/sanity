import PropTypes from 'prop-types'
import React from 'react'
import client from 'part:@sanity/base/client'
import userStore from 'part:@sanity/base/user'
import LoginDialog from 'part:@sanity/base/login-dialog'
import UnauthorizedUser from './UnauthorizedUser'
import ErrorDialog from './ErrorDialog'
import Spinner from 'part:@sanity/components/loading/spinner'
import CookieTest from './CookieTest'

const isProjectLogin = client.config().useProjectHostname

export default class LoginWrapper extends React.PureComponent {

  static propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    sanityLogo: PropTypes.node,
    showSanityLogo: PropTypes.bool
  }

  static defaultProps = {
    title: 'Choose login provider',
    description: null,
    sanityLogo: null,
    showSanityLogo: true
  };

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
      return <Spinner fullscreen center />
    }

    if (error) {
      return <ErrorDialog onRetry={this.handleRetry} error={error} />
    }

    if (!user) {
      return (
        <CookieTest>
          <LoginDialog
            title={this.props.title}
            description={this.props.description}
            sanityLogo={this.props.sanityLogo}
            showSanityLogo={this.props.showSanityLogo}
          />
        </CookieTest>
      )
    }

    if (isProjectLogin && !user.role) {
      return <UnauthorizedUser user={user} />
    }

    return this.props.children
  }
}
