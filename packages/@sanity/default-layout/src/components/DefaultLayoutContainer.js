import React from 'react'
import DefaultLayout from './DefaultLayout'
import locationStore from 'part:@sanity/base/location'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider} from 'part:@sanity/base/router'
import NotFound from './NotFound'
import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'

class DefaultLayoutContainer extends React.PureComponent {

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
    const tools = getOrderedTools()

    if (!location) {
      return null
    }

    const router = (
      <RouterProvider router={rootRouter} state={rootRouter.decode(location.pathname)} onNavigate={this.handleNavigate}>
        {rootRouter.isNotFound(location.pathname) ? <NotFound /> : <DefaultLayout tools={tools} />}
      </RouterProvider>
    )

    if (LoginWrapper) {
      return <LoginWrapper>{router}</LoginWrapper>
    }
    return router
  }
}

export default DefaultLayoutContainer
