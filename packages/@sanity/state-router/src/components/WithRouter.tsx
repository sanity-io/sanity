import React from 'react'
import withRouterHOC from './withRouterHOC'
import {Router} from './types'

type Props = {
  router?: Router
  children: (router: Router) => React.ReactElement
}

const WithRouter = withRouterHOC((props: Props) => props.children(props.router))

export default WithRouter
