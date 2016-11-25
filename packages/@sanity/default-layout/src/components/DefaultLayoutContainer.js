import React from 'react'
import DefaultLayout from './DefaultLayout'
import locationStore from 'part:@sanity/base/location'
import SanityIntlProvider from 'part:@sanity/base/sanity-intl-provider'
import LoginWrapperPart from 'part:@sanity/base/login-wrapper?'
import NoLogin from './NoLogin'
import NotFound from './NotFound'
import config from 'config:sanity'
import {RouterProvider} from 'part:@sanity/base/router'
import rootRouter from '../defaultLayoutRouter'

class DefaultLayoutContainer extends React.Component {

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
    const LoginWrapper = LoginWrapperPart || NoLogin

    if (!location) {
      return null
    }

    return (
      <SanityIntlProvider supportedLanguages={supportedLanguages}>
        <LoginWrapper>
          <RouterProvider router={rootRouter} state={rootRouter.decode(location.pathname)} onNavigate={this.handleNavigate}>
            {rootRouter.isNotFound(location.pathname) ? <NotFound /> : <DefaultLayout />}
          </RouterProvider>
        </LoginWrapper>
      </SanityIntlProvider>
    )
  }
}

export default DefaultLayoutContainer
