/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import generateHelpUrl from '@sanity/generate-help-url'
import {Dialog, Text, Box, Stack, Container} from '@sanity/ui'
import cancelWrap from './cancelWrap'
import {authenticationFetcher, pluginConfig, LoginDialogContent} from './legacyParts'

export default class LoginDialog extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    projectId: PropTypes.string,
    SanityLogo: PropTypes.func,
  }

  static defaultProps = {
    description: null,
    projectId: null,
    SanityLogo: null,
  }

  state = {
    providers: [],
    isLoaded: false,
    shouldRedirect: false,
    error: null,
  }

  componentDidMount() {
    this.getProviders = cancelWrap(authenticationFetcher.getProviders())
    this.getProviders.promise
      .then((providers) =>
        this.setState({
          providers: providers,
          isLoaded: true,
          shouldRedirect: providers.length === 1 && pluginConfig.providers.redirectOnSingle,
        })
      )
      .catch((err) => this.setState({error: err}))
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
    const params = [`origin=${currentUrl}`, projectId && `projectId=${projectId}`].filter(Boolean)

    if (provider.custom && !provider.supported && !this.state.error) {
      this.setState({
        error: {
          message:
            'This project is missing the required "thirdPartyLogin" ' +
            'feature to support custom logins.',
          link: generateHelpUrl('third-party-login'),
          hideClose: true,
        },
      })
      return
    }

    if (!this.state.error) {
      window.location = `${provider.url}?${params.join('&')}`
    }
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
        <Dialog
          header="Error"
          width={5}
          onClose={error?.hideClose ? undefined : this.handleErrorDialogClosed}
          onClickOutside={error?.hideClose ? undefined : this.handleErrorDialogClosed}
          cardShadow={2}
        >
          <Box padding={4}>
            <Stack space={4}>
              <Text>{error?.message}</Text>
              {error?.link && (
                <Text>
                  <a href={error.link}>Read more</a>
                </Text>
              )}
            </Stack>
          </Box>
        </Dialog>
      )
    }

    if (isLoaded && providers?.length === 0) {
      return (
        <Container padding={4} width={4}>
          <Text>No providers configured</Text>
        </Container>
      )
    }

    if (isLoaded && !shouldRedirect) {
      return (
        <Dialog header="Sign in" width={1} cardShadow={2}>
          <LoginDialogContent
            title={title}
            description={description}
            providers={providers}
            SanityLogo={SanityLogo}
            onLoginButtonClick={this.handleLoginButtonClicked}
          />
        </Dialog>
      )
    }
    return null
  }
}
