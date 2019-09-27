import React from 'react'
import {Provider} from 'react-redux'
import {applyMiddleware, createStore} from 'redux'
import {composeWithDevTools} from 'redux-devtools-extension/developmentOnly'
import {createEpicMiddleware} from 'redux-observable'
import {rootEpic, rootReducer} from '../modules'

const withRedux = ComposedComponent => {
  class WithReduxComponent extends React.PureComponent {
    constructor(props) {
      super(props)

      // Initialize redux middleware and create store.
      // The asset-browser store isn't persisted between mounts.
      const epicMiddleware = createEpicMiddleware()
      this.store = createStore(
        rootReducer,
        {},
        composeWithDevTools(applyMiddleware(epicMiddleware))
      )
      epicMiddleware.run(rootEpic)
    }

    render() {
      return (
        <Provider store={this.store}>
          <ComposedComponent {...this.props} />
        </Provider>
      )
    }
  }

  return WithReduxComponent
}

export default withRedux
