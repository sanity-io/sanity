import React from 'react'
import DefaultLayout from './DefaultLayout'
import locationStore from 'part:@sanity/base/location'
import SanityIntlProvider from 'part:@sanity/base/sanity-intl-provider'
import LoginWrapper from 'part:@sanity/base/login-wrapper'
import config from 'config:sanity'
import {RouterProvider} from '@sanity/state-router'
import rootRouter from '../defaultLayoutRouter'

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
    locationStore.actions.navigate(newUrl, options)
  }

  render() {
    const {location} = this.state
    const locale = config.locale || {}
    const supportedLanguages = locale.supportedLanguages || ['en-US']
    if (!location) {
      return null
    }

    return (
      <SanityIntlProvider supportedLanguages={supportedLanguages}>
        <LoginWrapper>
          <RouterProvider router={rootRouter} location={location} onNavigate={this.handleNavigate}>
            <DefaultLayout />
          </RouterProvider>
        </LoginWrapper>
      </SanityIntlProvider>
    )
  }
}

export default DefaultLayoutRouter
