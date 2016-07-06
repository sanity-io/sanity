import React, {PropTypes} from 'react'
import installationStore from 'datastore:@sanity/base/installation'
import SanityIntlProvider from 'component:@sanity/base/sanity-intl-provider'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import config from 'config:sanity'
import pluginConfig from 'config:@sanity/default-login'

export default class LoginDialog extends React.Component {

  constructor() {
    super()
    this.state = {installation: null}
  }

  componentWillMount() {
    this.installationSubscription = installationStore.currentInstallation
      .map(ev => ev.installation)
      .subscribe({
        next: installation => {
          this.setState({installation: installation})
        },
        error: error => {
          if (error instanceof installationStore.errors.NotFoundError) {
            this.setState({installation: null, error: error})
            return
          }
          throw error
        }
      })
  }

  componentWillUnmount() {
    this.installationSubscription.unsubscribe()
  }

  handleLoginButtonClicked(evnt) {
    evnt.preventDefault()
    const providerName = this
    window.location = `${pluginConfig.defaultLogin.host}/api/sanction/v1/installations/`
      + `${config.api.dataset}/login/${providerName}?target=${encodeURIComponent(window.location)}`
  }

  renderLoginScreen() {
    return (
      <div>
        <h3>
          <FormattedMessage id="loginWithProvider" />
        </h3>
        {this.state.installation.loginProviders.map(providerName => {
          return (
            <div key={providerName}>
              <button onClick={this.handleLoginButtonClicked.bind(providerName)}>
                <FormattedMessage id={providerName} />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <SanityIntlProvider supportedLanguages={config.locale.supportedLanguages}>
        {
          this.state.error && (
            <div className="error">
              {this.state.error.message}
              {this.state.error.details && this.state.error.details.map((detail, index) => {
                return <div key={`errorDetail-${index}`}>{detail.message}</div>
              })}
            </div>
          )
        }
        {this.state.installation && this.renderLoginScreen()}
      </SanityIntlProvider>
    )
  }

}
