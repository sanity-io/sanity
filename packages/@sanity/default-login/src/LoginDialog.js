/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import pluginConfig from 'config:@sanity/default-login'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import LoginDialogContent from 'part:@sanity/base/login-dialog-content'
import generateHelpUrl from '@sanity/generate-help-url'
import styles from './styles/LoginDialog.css'
import cancelWrap from './cancelWrap'

export default class LoginDialog extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    projectId: PropTypes.string,
    SanityLogo: PropTypes.func
  }

  static defaultProps = {
    description: null,
    projectId: null,
    SanityLogo: null
  }

  state = {
    providers: [],
    isLoaded: false,
    shouldRedirect: false,
    error: null
  }

  componentDidMount() {
    this.getProviders = cancelWrap(authenticationFetcher.getProviders())
    this.getProviders.promise
      .then(providers =>
        this.setState({
          providers: providers,
          isLoaded: true,
          shouldRedirect: providers.length === 1 && pluginConfig.providers.redirectOnSingle
        })
      )
      .catch(err => this.setState({error: err}))
  }

  componentWillUnmount() {
    this.getProviders.cancel()
  }

  componentDidUpdate() {
    const {providers, isLoaded, shouldRedirect} = this.state
    if (isLoaded && shouldRedirect) {
      this.redirectToProvider(providers[0])
    }
  }

  redirectToProvider(provider) {
    const {projectId} = this.props
    const currentUrl = encodeURIComponent(window.location.toString())
    const ua = navigator.userAgent || ''
    const isSafari = ua.includes('Safari') && !ua.includes('Chrome')
    const params = [
      `origin=${currentUrl}`,
      projectId && `projectId=${projectId}`,
      projectId && isSafari && `withSid=1`
    ].filter(Boolean)

    if (provider.custom && !provider.supported) {
      this.setState({
        error: {
          message:
            'This project is missing the required "thirdPartyLogin" ' +
            'feature to support custom logins.',
          link: generateHelpUrl('third-party-login')
        }
      })
      return
    }
    window.location = `${provider.url}?${params.join('&')}`
  }

  handleLoginButtonClicked = (provider, evnt) => {
    evnt.preventDefault()
    this.redirectToProvider(provider)
  }

  handleErrorDialogClosed = () => {
    this.setState({error: null})
  }

  render() {
    const {error, providers, isLoaded, shouldRedirect} = this.state
    const {title, description, SanityLogo} = this.props

    if (error) {
      return (
        <FullscreenDialog
          color="danger"
          title="Error"
          isOpen
          centered
          onClose={this.handleErrorDialogClosed}
        >
          <div className={styles.error}>
            {error.message}
            {error.link && (
              <p>
                <a href={error.link}>Read more</a>
              </p>
            )}
          </div>
        </FullscreenDialog>
      )
    }

    if (isLoaded && providers.length === 0) {
      return <div>No providers configured</div>
    }

    if (isLoaded && !shouldRedirect) {
      return (
        <LoginDialogContent
          title={title}
          description={description}
          providers={providers}
          SanityLogo={SanityLogo}
          onLoginButtonClick={this.handleLoginButtonClicked}
        />
      )
    }
    return null
  }
}
