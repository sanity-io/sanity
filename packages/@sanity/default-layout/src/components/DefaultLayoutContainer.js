import React from 'react'
import DefaultLayout from './DefaultLayout'
import LoginWrapper from 'part:@sanity/base/login-wrapper?'
import {RouterProvider, RouteScope} from 'part:@sanity/base/router'
import NotFound from './NotFound'
import getOrderedTools from '../util/getOrderedTools'
import rootRouter from '../defaultLayoutRouter'
import * as urlStateStore from '../datastores/urlState'

export default class DefaultLayoutContainer extends React.PureComponent {
  state = {}

  componentWillMount() {
    this.urlStateSubscription = urlStateStore.state
      .subscribe({
        next: event => this.setState({
          urlState: event.state,
          isNotFound: event.isNotFound,
          intent: event.intent
        })
      })
  }

  componentWillUnmount() {
    this.urlStateSubscription.unsubscribe()
  }

  handleNavigate(newUrl, options) {
    urlStateStore.navigate(newUrl, options)
  }

  render() {
    const {intent, urlState, isNotFound} = this.state
    const tools = getOrderedTools()

    const content = isNotFound
      ? (
        <NotFound>{
          intent && (
            <div>
              No tool can handle the intent:
              {' '} <strong>{intent.name}</strong> {' '}
              with parameters <pre>{JSON.stringify(intent.params)}</pre>
            </div>
          )}
        </NotFound>
      ) : <DefaultLayout tools={tools} />

    const router = (
      <RouterProvider router={rootRouter} state={urlState} onNavigate={this.handleNavigate}>
        {content}
      </RouterProvider>
    )
    return router

    return LoginWrapper ? <LoginWrapper>{router}</LoginWrapper> : router
  }
}

