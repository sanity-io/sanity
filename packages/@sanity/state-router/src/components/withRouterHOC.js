// @flow
import React, {PropTypes} from 'react'
import type {ContextRouter, InternalRouter} from './types'

export default function withRouter(ComposedComponent: ReactClass<{}>) : ReactClass<{}> {
  return class extends React.Component {
    static displayName = `withRouter(${ComposedComponent.displayName || ComposedComponent.name})`

    unsubscribe: () => void

    context: {
      __internalRouter : InternalRouter,
      router: ContextRouter
    }


    static contextTypes = {
      __internalRouter: PropTypes.object
    }

    constructor(props, context) {
      super()
      const __internalRouter = context.__internalRouter
      this.state = {routerState: __internalRouter.getState()}
    }


    componentWillMount() {
      const __internalRouter = this.context.__internalRouter
      this.unsubscribe = __internalRouter.channel.subscribe(() => {
        this.setState({routerState: __internalRouter.getState()})
      })
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    render() {
      const router = {
        state: this.state.routerState,
        navigate: this.context.__internalRouter.navigate
      }
      return <ComposedComponent {...this.props} router={router} />
    }
  }
}
