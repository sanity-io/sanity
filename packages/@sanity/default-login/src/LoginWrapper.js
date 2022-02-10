import PropTypes from 'prop-types'
import React from 'react'
import {SanityLogo as SanityLogotype} from '@sanity/logos'
import {Spinner, Container, Flex} from '@sanity/ui'
import {of} from 'rxjs'
import {map, catchError} from 'rxjs/operators'
import CookieTest from './CookieTest'
import ErrorDialog from './ErrorDialog'
import UnauthorizedUser from './UnauthorizedUser'
import {versionedClient} from './versionedClient'
import {userStore, LoginDialog} from './legacyParts'

const isProjectLogin = versionedClient.config().useProjectHostname
const projectId =
  isProjectLogin && versionedClient.config().projectId ? versionedClient.config().projectId : null

export default class LoginWrapper extends React.PureComponent {
  static propTypes = {
    children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    title: PropTypes.node,
    description: PropTypes.node,
    sanityLogo: PropTypes.node,
    SanityLogo: PropTypes.oneOfType([PropTypes.object, PropTypes.node, PropTypes.func]),
    LoadingScreen: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  }

  static defaultProps = {
    title: 'Choose a login provider',
    description: null,
    sanityLogo: null,
    SanityLogo: SanityLogotype,
    LoadingScreen: (
      <Container padding={4} height="fill">
        <Flex justify="center" align="center" height="fill">
          <Spinner />
        </Flex>
      </Container>
    ),
  }

  state = {isLoading: true, user: null, error: null}

  userSubscription = null

  constructor(props) {
    super(props)

    let sync = true
    this.userSubscription = userStore.me
      .pipe(
        map((currentUser) => ({
          user: currentUser,
          isLoading: false,
        })),
        catchError((error) => {
          return of({user: null, error, isLoading: false})
        })
      )
      .subscribe({
        next: (userState) => {
          // Because observables _can_ be synchronous, it's not safe to call `setState` as it is a noop
          // We must therefore explicitly check whether or not we were call synchronously
          if (sync) {
            // eslint-disable-next-line react/no-direct-mutation-state
            this.state = {...this.state, ...userState}
          } else {
            this.setState(userState)
          }
        },
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

    return typeof children === 'function' ? children(user) : <>{children}</>
  }
}
