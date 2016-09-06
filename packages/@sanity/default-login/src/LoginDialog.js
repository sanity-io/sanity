import React from 'react'
import projectStore from 'datastore:@sanity/base/project'
import {FormattedMessage} from 'component:@sanity/base/locale/intl'
import config from 'config:sanity'
import pluginConfig from 'config:@sanity/default-login'

export default class LoginDialog extends React.Component {

  constructor() {
    super()
    this.state = {project: null}
  }

  componentWillMount() {
    this.projectSubscription = projectStore.currentProject
      .map(ev => ev.project)
      .subscribe({
        next: project => {
          this.setState({project: project})
        },
        error: error => {
          if (error instanceof projectStore.errors.NotFoundError) {
            this.setState({project: null, error: error})
            return
          }
          throw error
        }
      })
  }

  componentWillUnmount() {
    this.projectSubscription.unsubscribe()
  }

  handleLoginButtonClicked(evnt) {
    evnt.preventDefault()
    const providerName = this
    window.location = `${pluginConfig.defaultLogin.host}/api/sanction/v1/projects/`
      + `${config.api.dataset}/login/${providerName}?target=${encodeURIComponent(window.location)}`
  }

  renderLoginScreen() {
    return (
      <div>
        <h3>
          <FormattedMessage id="loginWithProvider" />
        </h3>
        {this.state.project.loginProviders.map(providerName => {
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
      <div>
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
        {this.state.project && this.renderLoginScreen()}
      </div>
    )
  }

}
