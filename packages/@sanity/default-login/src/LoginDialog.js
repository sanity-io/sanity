import React from 'react'
import authenticationFetcher from 'machine:@sanity/base/authentication-fetcher'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import client from 'client:@sanity/base/client'

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

  handleLoginButtonClicked(providerName, evnt) {
    evnt.preventDefault()
    const currentUrl = encodeURIComponent(window.location.toString())
    const url = client.getUrl(`/auth/login/${providerName}?target=${currentUrl}`)
    window.location = url
  }

  renderLoginScreen() {
    return (
      <div>
        <h3>
          <FormattedMessage id="loginWithProvider" />
        </h3>
        {this.state.providers.map(provider => {
          const onLoginClick = this.handleLoginButtonClicked.bind(this, provider.name)
          return (
            <div key={provider.name}>
              <button onClick={onLoginClick}>
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
