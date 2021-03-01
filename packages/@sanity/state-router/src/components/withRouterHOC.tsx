import React, {ComponentType} from 'react'
import internalRouterContextTypeCheck from './internalRouterContextTypeCheck'
import {HOCRouter, InternalRouter} from './types'

const NO_CONTEXT_STATE = {
  state: {},
  navigate: (state) => {
    throw new Error(
      `Cannot navigate to the state ${JSON.stringify(state)}. No router found in context`
    )
  },
  navigateIntent: (intentName) => {
    throw new Error(`Cannot navigate to the intent ${intentName}. No router found in context`)
  },
}

type ChildProps<OuterProps> = OuterProps & {router: HOCRouter}

export default function withRouterHOC<OuterProps>(
  Component: ComponentType<ChildProps<OuterProps>>
) {
  return class WithRouter extends React.Component<OuterProps> {
    static displayName = `withRouter(${Component.displayName || Component.name})`
    unsubscribe: (() => void) | null = null

    state = {
      routerState: {},
    }

    context: {
      __internalRouter?: InternalRouter
    } | null = null

    static contextTypes = {
      __internalRouter: internalRouterContextTypeCheck,
    }

    constructor(props, context) {
      super(props)

      const __internalRouter = context.__internalRouter

      if (__internalRouter) {
        this.state = {routerState: __internalRouter.getState()}
      }
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
      if (!this.context) throw new Error('WithRouter: missing context value')

      const __internalRouter = this.context.__internalRouter
      if (!__internalRouter) {
        return
      }
      this.unsubscribe = __internalRouter.channel.subscribe(() => {
        this.setState({routerState: __internalRouter.getState()})
      })
    }

    componentWillUnmount() {
      if (this.unsubscribe) this.unsubscribe()
    }

    render() {
      if (!this.context) throw new Error('WithRouter: missing context value')

      const internalRouter = this.context.__internalRouter

      const router: HOCRouter = internalRouter
        ? {
            state: this.state.routerState,
            navigate: internalRouter.navigate,
            navigateIntent: internalRouter.navigateIntent,
          }
        : NO_CONTEXT_STATE

      return <Component {...this.props} router={router} />
    }
  }
}
