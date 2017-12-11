import PropTypes from 'prop-types'
import React from 'react'
import client from 'part:@sanity/base/client'
import userStore from 'part:@sanity/base/user'

import CookieTest from './CookieTest'
import LoginDialog from 'part:@sanity/base/login-dialog'
import ErrorDialog from './ErrorDialog'
import SanityStudioLogo from 'part:@sanity/base/sanity-studio-logo'
import Spinner from 'part:@sanity/components/loading/spinner'
import UnauthorizedUser from './UnauthorizedUser'


const isProjectLogin = client.config().useProjectHostname
const projectId = (isProjectLogin && client.config().projectId)
  ? client.config().projectId : null

export default class LoginWrapper extends React.PureComponent {

  static propTypes = {
    children: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func
    ]).isRequired,
    title: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node
    ]),
    description: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.node
    ]),
    sanityLogo: PropTypes.element,
    loadingScreen: PropTypes.element,
  }

  static defaultProps = {
    title: 'Choose login provider',
    description: null,
    sanityLogo: <SanityStudioLogo />,
    loadingScreen: <Spinner center fullscreen />
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
    const {children, loadingScreen, sanityLogo} = this.props
    if (isLoading) {
      return loadingScreen
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
            sanityLogo={sanityLogo}
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
