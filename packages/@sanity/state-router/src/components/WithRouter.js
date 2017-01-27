// @flow
import {Element} from 'react'
import type {ContextRouter} from './types'
import withRouterHOC from './withRouterHOC'

type Props = {
  router: ContextRouter,
  children: (ContextRouter) => Element<*>
}

const WithRouter = withRouterHOC((props : Props) => props.children(props.router))
WithRouter.displayName = 'WithRouter'

export default WithRouter
