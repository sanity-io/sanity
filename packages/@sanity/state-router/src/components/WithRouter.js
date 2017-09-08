// @flow
import * as React from 'react'
import type {Router} from './types'
import withRouterHOC from './withRouterHOC'

type Props = {
  router: Router,
  children: (Router) => React.Node
}

const WithRouter = withRouterHOC((props: Props) => props.children(props.router))

export default WithRouter
