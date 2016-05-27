import React from 'react'
import DefaultLayout from './DefaultLayout'
import {Router, Route, NotFound, Redirect} from 'router:@sanity/base/router'
import locationStore from 'datastore:@sanity/base/location'
import SanityIntlProvider from 'component:@sanity/base/sanity-intl-provider'

class DefaultLayoutRouter extends React.Component {
  constructor() {
    super()
    this.state = {}
    this.handleNavigate = this.handleNavigate.bind(this)
  }

  componentWillMount() {
    this.pathSubscription = locationStore
      .state
      .subscribe({next: event => this.setState({location: event.location})})
  }

  componentWillUnmount() {
    this.pathSubscription.unsubscribe()
  }

  handleNavigate(newUrl, options) {
    locationStore.actions.navigate(newUrl)
  }

  render() {
    const {location} = this.state
    if (!location) {
      return null
    }

    return (
      <SanityIntlProvider>
        <Router location={location} navigate={this.handleNavigate}>
          <Route path="/:site/*" component={DefaultLayout} />
          <Redirect path="/" to="/some-site" />
          <NotFound component={() => <div>Not found</div>} />
        </Router>
      </SanityIntlProvider>
    )
  }
}

export default DefaultLayoutRouter
