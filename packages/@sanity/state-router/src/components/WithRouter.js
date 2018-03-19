// @flow
import React from 'react'
import withRouterHOC from './withRouterHOC'
import type {Router} from './types'
import type {Node} from 'react'

type Props = {
  router: Router,
  children: Router => Node
}

const WithRouter = withRouterHOC((props: Props) => props.children(props.router))

export default WithRouter
