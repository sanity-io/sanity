import React from 'react'
import authenticationFetcher from 'part:@sanity/base/authentication-fetcher'
import {FormattedMessage} from 'part:@sanity/base/locale/intl'
import client from 'part:@sanity/base/client'
import cancelWrap from './cancelWrap'

export default class LoginDialog extends React.Component {
  state = {
    providers: [],
    error: null
  };

  componentDidMount() {
    this.getProviders = cancelWrap(authenticationFetcher.getProviders())
    this.getProviders.promise.then(providers => {
      this.setState({providers: providers})
    })
    .catch(err => {
      this.setState({error: err})
    })
  }
  componentWillUnmount() {
    this.getProviders.cancel()
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
