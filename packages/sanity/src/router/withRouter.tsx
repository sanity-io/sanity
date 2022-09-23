import React, {ComponentType, FunctionComponent} from 'react'
import {RouterContextValue} from './types'
import {useRouter} from './useRouter'

/**
 * @public
 */
export function withRouter<Props extends {router: RouterContextValue}>(
  Component: ComponentType<Props>
): FunctionComponent<Omit<Props, 'router'>> {
  function WithRouter(props: Omit<Props, 'router'>) {
    const router = useRouter()

    return <Component {...(props as Props)} router={router} />
  }

  WithRouter.displayName = `withRouter(${Component.displayName || Component.name})`

  return WithRouter
}

/**
 * @public
 */
export interface WithRouterProps {
  router: RouterContextValue
  children: (router: RouterContextValue) => React.ReactElement
}

/**
 * @public
 */
export const WithRouter = withRouter((props: WithRouterProps) => props.children(props.router))
