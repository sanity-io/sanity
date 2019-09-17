import React from 'react'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'
import {Router, InternalRouter} from './types'
import {ComponentType} from 'react'

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

type ChildProps<OuterProps> = OuterProps & {router: Router}

export default function withRouterHOC<OuterProps>(
  Component: ComponentType<ChildProps<OuterProps>>
) {
  return class WithRouter extends React.Component<OuterProps> {
    static displayName = `withRouter(${Component.displayName || Component.name})`
    unsubscribe: () => void
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
      super(props)
      const __internalRouter = context.__internalRouter
      if (__internalRouter) {
        this.state = {routerState: __internalRouter.getState()}
      }
    }

    UNSAFE_componentWillMount() {
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
