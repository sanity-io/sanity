import PropTypes from 'prop-types'
import React from 'react'
import client from 'part:@sanity/base/client'
import userStore from 'part:@sanity/base/user'

import LoginDialog from 'part:@sanity/base/login-dialog'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import Spinner from 'part:@sanity/components/loading/spinner'
import CookieTest from './CookieTest'
import ErrorDialog from './ErrorDialog'
import UnauthorizedUser from './UnauthorizedUser'

const isProjectLogin = client.config().useProjectHostname
const projectId = isProjectLogin && client.config().projectId ? client.config().projectId : null

export default class LoginWrapper extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
    title: PropTypes.node,
    description: PropTypes.node,
    sanityLogo: PropTypes.node,
    SanityLogo: PropTypes.func,
    LoadingScreen: PropTypes.oneOfType([PropTypes.node, PropTypes.func])
  }

  static defaultProps = {
    title: 'Log in with',
    description: null,
    sanityLogo: null,
    SanityLogo: SanityStudioLogo,
    LoadingScreen: Spinner
  }

  state = {isLoading: true, user: null, error: null}

  componentWillMount() {
    this.userSubscription = userStore.currentUser.subscribe({
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
    const {children, LoadingScreen, sanityLogo, SanityLogo} = this.props
    if (sanityLogo) {
      const warning =
        'sanityLogo is a deprecated property on LoginWrapper. Pass a React component to the SanityLogo property instead.'
      console.warn(warning) // eslint-disable-line no-console
    }

    if (isLoading) {
      return typeof LoadingScreen === 'function' ? (
        <LoadingScreen center fullscreen />
      ) : (
        LoadingScreen
      )
    }

    if (error) {
      return <ErrorDialog onRetry={this.handleRetry} error={error} />
    }

    if (!user) {
      return (
        <CookieTest {...this.props}>
          <LoginDialog
            title={this.props.title}
            description={this.props.description}
            SanityLogo={SanityLogo}
            projectId={projectId}
          />
        </CookieTest>
      )
    }

    if (projectId && !user.role) {
      return <UnauthorizedUser user={user} />
    }

    return typeof children === 'function' ? children(user) : children
  }
}
