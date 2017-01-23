// @flow
import React, {PropTypes} from 'react'
import type {ContextRouter} from './types'

type Context = {
  router: ContextRouter
}

export default function withRouter(ComposedComponent: ReactClass<{}>) : ReactClass<{}> {
  return class extends React.Component {
    static displayName = ComposedComponent.constructor.displayName

    context: Context

    static contextTypes = {
      router: PropTypes.object
    }

    render() {
      const router : ContextRouter = this.context.router
      return <ComposedComponent {...this.props} router={router} />
    }
  }
}
