import React, {ComponentType, FunctionComponent} from 'react'
import {RouterContextValue} from './types'
import {useRouter} from './useRouter'

/**
 * A higher-order component that injects the `router` object from the `useRouter` hook
 * into the props of the wrapped component.
 *
 * @internal
 * @deprecated - Use the `useRouter` hook instead.
 *
 * @param Component - The component to wrap.
 *
 * @returns The wrapped component.
 *
 * @example
 * ```tsx
 * function MyComponent(props) {
 *  return <div>{props.router.state.myParam}</div>
 * }
 *
 * export default withRouter(MyComponent)
 * ```
 */
export function withRouter<Props extends {router: RouterContextValue}>(
  Component: ComponentType<Props>,
): FunctionComponent<Omit<Props, 'router'>> {
  function WithRouter(props: Omit<Props, 'router'>) {
    const router = useRouter()

    return <Component {...(props as Props)} router={router} />
  }

  WithRouter.displayName = `withRouter(${Component.displayName || Component.name})`

  return WithRouter
}

/**
 * @internal
 * @deprecated - Use the `useRouter` hook instead.
 */
export interface WithRouterProps {
  /**
   * The `router` object from the `useRouter` hook.
   *  {@link RouterContextValue}
   */
  router: RouterContextValue
  /**
   * A function that renders the wrapped component with the `router` object as a parameter.
   */
  children: (router: RouterContextValue) => React.ReactElement
}

/**
 * A higher-order component that injects the router object into its child component.
 *
 * @internal
 * @deprecated - Use the `useRouter` hook instead.
 *
 * @returns The rendered component.
 *
 * @example
 * ```tsx
 * function MyComponent(props: {router: Router}) {
 *   const {location} = props.router
 *   const {pathname} = location
 *   return <p>The current path is: {pathname}</p>
 * }
 *
 * function App() {
 *   return (
 *     <Router>
 *       <WithRouter>
 *         {router => <MyComponent router={router} />}
 *       </WithRouter>
 *     </Router>
 *   )
 * }
 * ```
 */
export const WithRouter = withRouter((props: WithRouterProps) => props.children(props.router))
