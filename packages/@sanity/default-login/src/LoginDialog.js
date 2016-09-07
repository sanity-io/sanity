import React from 'react'
import authenticationFetcher from 'machine:@sanity/base/authentication-fetcher'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import config from 'config:sanity'
import pluginConfig from 'config:@sanity/default-login'

export default class LoginDialog extends React.Component {

  constructor() {
    super()
    this.state = {providers: [], error: null}
  }

  componentWillMount() {
    authenticationFetcher.getProviders().then(providers => {
      this.setState({providers: providers})
    }).catch(err => {
      this.setState({error: err})
    })
  }

  handleLoginButtonClicked(evnt) {
    evnt.preventDefault()
    const providerName = this
    window.location = `${pluginConfig.defaultLogin.host}/auth/login/${providerName}?target=${encodeURIComponent(window.location)}`
  }

  renderLoginScreen() {
    return (
      <div>
        <h3>
          <FormattedMessage id="loginWithProvider" />
        </h3>
        {this.state.providers.map(provider => {
          return (
            <div key={provider.name}>
              <button onClick={this.handleLoginButtonClicked.bind(provider.name)}>
                <FormattedMessage id={provider.name} />
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  render() {
    return (
      <div>
        {
          this.state.error && (
            <div className="error">
              {this.state.error.message}
            </div>
          )
        }
        {this.state.providers.length > 0 && this.renderLoginScreen()}
      </div>
    )
  }

}
