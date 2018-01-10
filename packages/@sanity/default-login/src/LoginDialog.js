/* eslint-disable react/no-multi-comp */
import React from 'react'
import PropTypes from 'prop-types'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import cancelWrap from './cancelWrap'
import styles from './styles/LoginDialog.css'
import config from 'config:sanity'
import BrandLogo from 'part:@sanity/base/brand-logo?'
import pluginConfig from 'config:@sanity/default-login'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import generateHelpUrl from '@sanity/generate-help-url'

const projectName = (config.project && config.project.name) || ''

/* eslint-disable max-len */
const GithubLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 438.55 438.55">
    <path d="M409.13 114.57a218.32 218.32 0 0 0-79.8-79.8Q278.94 5.36 219.27 5.36T109.21 34.77a218.29 218.29 0 0 0-79.8 79.8Q0 165 0 224.63q0 71.67 41.83 128.91t108.06 79.23q7.71 1.43 11.42-2a11.17 11.17 0 0 0 3.69-8.57q0-.86-.14-15.42t-.14-25.41l-6.57 1.14a83.77 83.77 0 0 1-15.85 1 120.73 120.73 0 0 1-19.84-2 44.34 44.34 0 0 1-19.11-8.51 36.23 36.23 0 0 1-12.56-17.6l-2.86-6.57a71.34 71.34 0 0 0-9-14.56q-6.14-8-12.42-10.85l-2-1.43a21 21 0 0 1-3.71-3.43 15.66 15.66 0 0 1-2.57-4q-.86-2 1.43-3.29C61.2 310.42 64 310 68 310l5.71.85q5.71 1.14 14.13 6.85a46.08 46.08 0 0 1 13.85 14.84q6.57 11.71 15.85 17.85t18.7 6.14a81.19 81.19 0 0 0 16.27-1.42 56.78 56.78 0 0 0 12.85-4.29q2.57-19.14 14-29.41a195.49 195.49 0 0 1-29.36-5.13 116.52 116.52 0 0 1-26.83-11.14 76.86 76.86 0 0 1-23-19.13q-9.14-11.42-15-30t-5.8-42.81q0-34.55 22.56-58.82-10.57-26 2-58.24 8.28-2.57 24.55 3.85t23.84 11q7.57 4.56 12.13 7.71a206.2 206.2 0 0 1 109.64 0l10.85-6.85a153.65 153.65 0 0 1 26.26-12.56q15.13-5.71 23.13-3.14 12.84 32.26 2.28 58.24 22.55 24.27 22.56 58.82 0 24.27-5.85 43t-15.12 30a79.82 79.82 0 0 1-23.13 19 116.74 116.74 0 0 1-26.84 11.14 195.29 195.29 0 0 1-29.23 5.07q14.8 12.84 14.81 40.58v60.2a11.37 11.37 0 0 0 3.57 8.56q3.57 3.42 11.28 2 66.24-22 108.07-79.23t41.83-128.91q-.03-59.62-29.43-110.05z" />
  </svg>
)

const GoogleLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path d="M11 24a13 13 0 0 1 .66-4.08l-7.4-5.66a22.18 22.18 0 0 0 0 19.49l7.4-5.67A13 13 0 0 1 11 24z" fill="#fbbc05" />
    <path d="M24 11a12.72 12.72 0 0 1 8.1 2.9l6.4-6.4a22 22 0 0 0-34.24 6.75l7.4 5.66A13 13 0 0 1 24 11z" fill="#ea4335" />
    <path d="M24 37a13 13 0 0 1-12.34-8.92l-7.4 5.66A21.93 21.93 0 0 0 24 46a21 21 0 0 0 14.33-5.48l-7-5.44A13.59 13.59 0 0 1 24 37zm-12.35-8.93l-7.4 5.67 7.4-5.66z" fill="#34a853" />
    <path d="M44.5 20H24v8.5h11.8a9.91 9.91 0 0 1-4.49 6.58l7 5.44C42.37 36.76 45 31.17 45 24a18.25 18.25 0 0 0-.5-4z" fill="#4285f4" />
  </svg>
)

const QuestionmarkLogo = () => (
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="#666">
    <path d="M500,9.9c270.1,0,490.5,220.6,490,490.3c-0.5,270.7-220.6,490.6-490.3,489.9C229.2,989.4,10.4,770.5,10,500.1C9.6,230.3,229.9,9.9,500,9.9z M943.7,499.9c0-244.4-198-443-443.5-443.5C255.5,55.9,56.6,254.5,56.3,499.9c-0.3,244.4,198.3,442.9,443.4,443.6C743.8,944.2,943.8,744.5,943.7,499.9z" />
    <path d="M527.3,658.3c-20.9,0-41.3,0-62.2,0c0-12.4-0.7-24.6,0.1-36.7c1.6-24.4,7.3-47.9,20-69.2c9.9-16.6,22.6-30.9,36.7-44c17.5-16.3,35.1-32.4,52.3-49.1c10.1-9.8,19-20.8,23.7-34.4c11.2-32.7,4-61.8-17.7-87.8c-36.1-43.1-96.4-44.6-133.4-23c-23.3,13.6-37.3,34.4-45.4,59.5c-3.7,11.2-6.2,22.8-9.5,35.1c-21.5-2.5-43.5-5.2-66.3-7.9c0.9-5.7,1.5-11,2.5-16.3c5.7-29.6,15.9-57.2,35.3-80.8c23.5-28.8,54.2-45.6,90.3-52.5c37.7-7.2,75.3-6.5,112,5.5c46.9,15.2,81.6,45,97.4,92.4c15.1,45.5,7.7,88.5-22.1,127c-18.9,24.4-42.4,44.2-64.5,65.4c-9.7,9.3-19.6,18.7-28,29.2c-12.5,15.5-17.3,34.3-18.8,53.9C528.6,635.5,528.1,646.6,527.3,658.3z" />
    <path d="M461,790c0-24.6,0-48.9,0-73.7c24.6,0,49,0,73.7,0c0,24.5,0,48.9,0,73.7C510.3,790,485.8,790,461,790z" />
  </svg>
)
/* eslint-enable max-len */

function getProviderLogo(provider) {
  switch (provider.name) {
    case 'google':
      return GoogleLogo
    case 'github':
      return GithubLogo
    default:
      return function CustomLogo() {
        return provider.logo
          ? <img src={provider.logo} />
          : <QuestionmarkLogo />
      }
  }
}

export default class LoginDialog extends React.Component {
  static propTypes = {
    title: PropTypes.node.isRequired,
    description: PropTypes.node,
    sanityLogo: PropTypes.node,
    SanityLogo: PropTypes.func,
    projectId: PropTypes.string
  };

  static defaultProps = {
    description: null,
    SanityLogo: null,
    sanityLogo: null,
    projectId: null
  }

  state = {
    providers: [],
    error: null
  };

  componentDidMount() {
    this.getProviders = cancelWrap(authenticationFetcher.getProviders())
    this.getProviders.promise
      .then(providers => this.setState({providers: providers}))
      .catch(err => this.setState({error: err}))
  }

  componentWillUnmount() {
    this.getProviders.cancel()
  }

  componentWillUpdate(_, nextState) {
    const {providers} = nextState
    if (providers.length === 1 && (
      pluginConfig.providers
      && pluginConfig.providers.redirectOnSingle
    )) {
      this.redirectToProvier(providers[0])
    }
  }

  redirectToProvier(provider) {
    const {projectId} = this.props
    const currentUrl = encodeURIComponent(window.location.toString())
    const params = [
      `origin=${currentUrl}`,
      projectId && `projectId=${projectId}`
    ].filter(Boolean)
    if (provider.custom && !provider.supported) {
      this.setState({
        error: {
          message: 'This project is missing the required "thirdPartyLogin" '
            + 'feature to support custom logins.',
          link: generateHelpUrl('third-party-login')
        }
      })
      return
    }
    window.location = `${provider.url}?${params.join('&')}`
  }

  handleLoginButtonClicked(provider, evnt) {
    evnt.preventDefault()
    this.redirectToProvier(provider)
  }

  renderLoginScreen() {
    const {title, description, SanityLogo, sanityLogo} = this.props
    return (
      <div className={styles.root}>

        <div className={styles.inner}>
          { SanityLogo && (
            <div className={styles.sanityLogo}>
              <SanityLogo />
            </div>
          )}
          { sanityLogo && !SanityLogo && (
            <div className={styles.sanityLogo}>
              {sanityLogo}
            </div>
          )}

          <div className={styles.branding}>
            <h1 className={BrandLogo ? styles.projectNameHidden : styles.projectName}>{projectName}</h1>
            {
              BrandLogo && <div className={styles.brandLogoContainer}><BrandLogo projectName={projectName} /></div>
            }
          </div>

          <h2 className={styles.title}>
            {title}
          </h2>
          { description && (
            <div className={styles.description}>{description}</div>
          )}
          <ul className={styles.providers}>
            {this.state.providers.map(provider => {
              const ProviderLogo = getProviderLogo(provider)
              const onLoginClick = this.handleLoginButtonClicked.bind(this, provider)
              return (
                <li key={provider.name} className={styles.provider}>
                  <button onClick={onLoginClick} className={styles.providerButton}>
                    <span className={styles.providerLogo}>
                      <ProviderLogo />
                    </span>
                    <span className={styles.providerName}>
                      {provider.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

        </div>
      </div>
    )
  }

  handleErrorDialogClosed = () => {
    this.setState({error: null})
  }

  render() {
    return (
      <div>
        {
          this.state.error && (
            <FullscreenDialog
              color="danger"
              title="Error"
              isOpen
              centered
              onClose={this.handleErrorDialogClosed}
            >
              <div className={styles.error}>
                {this.state.error.message}
                {this.state.error.link && (
                  <p><a href={this.state.error.link}>Read more</a></p>
                )}
              </div>
            </FullscreenDialog>
          )
        }
        {this.state.providers.length > 0 && this.renderLoginScreen()}
      </div>
    )
  }

}
