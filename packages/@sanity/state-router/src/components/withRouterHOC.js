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

    state = {routerState: null}

    componentWillMount() {
      const __internalRouter = this.context.__internalRouter
      this.unsubscribe = __internalRouter.channel.subscribe(state => {
        this.setState({routerState: state})
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
