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
    title: 'Choose a login provider',
    description: null,
    sanityLogo: null,
    SanityLogo: SanityStudioLogo,
    LoadingScreen: Spinner
  }

  state = {isLoading: true, user: null, error: null}

  userSubscription = null

  constructor(props) {
    super(props)

    let sync = true

    this.userSubscription = userStore.currentUser.subscribe({
      next: evt => {
        // Because observables _can_ be syncronous, it's not safe to call `setState` as it is a noop
        // We must therefore explicitly check whether or not we were call syncronously
        const newState = {user: evt.user, error: evt.error, isLoading: false}
        if (sync) {
          // eslint-disable-next-line react/no-direct-mutation-state
          this.state = {...this.state, ...newState}
        } else {
          this.setState(newState)
        }
      },
      error: error => this.setState({error, isLoading: false})
    })

    sync = false
  }

  componentWillUnmount() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe()
    }
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
