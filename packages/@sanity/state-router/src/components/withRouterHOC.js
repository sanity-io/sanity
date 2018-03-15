// @flow
import React from 'react'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'
import type {Router, InternalRouter} from './types'
import type {ComponentType} from 'react'

type State = {
  routerState: Object
}

const NO_CONTEXT_STATE = {
  state: {},
  navigate: state => {
    throw new Error(
      `Cannot navigate to the state ${JSON.stringify(state)}. No router found in context`
    )
  },
  navigateIntent: intentName => {
    throw new Error(`Cannot navigate to the intent ${intentName}. No router found in context`)
  }
}

export default function withRouter<Props: {}>(
  Component: ComponentType<{router: Router} & Props>
): ComponentType<Props> {
  return class extends React.Component<*, *> {
    static displayName = `withRouter(${Component.displayName || Component.name})`
    unsubscribe: () => void
    state: State

    state = {
      routerState: {}
    }

    context: {
      __internalRouter?: InternalRouter
    }

    static contextTypes = {
      __internalRouter: internalRouterContextTypeCheck
    }

    constructor(props, context) {
      super()
      const __internalRouter = context.__internalRouter
      if (__internalRouter) {
        this.state = {routerState: __internalRouter.getState()}
      }
    }

    componentWillMount() {
      const __internalRouter = this.context.__internalRouter
      if (!__internalRouter) {
        return
      }
      this.unsubscribe = __internalRouter.channel.subscribe(() => {
        this.setState({routerState: __internalRouter.getState()})
      })
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    render() {
      const internalRouter = this.context.__internalRouter

      const router: Router = internalRouter
        ? {
            state: this.state.routerState,
            navigate: internalRouter.navigate,
            navigateIntent: internalRouter.navigateIntent
          }
        : NO_CONTEXT_STATE

      return <Component {...this.props} router={router} />
    }
  }
}
