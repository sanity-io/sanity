import React, {ComponentType, FunctionComponent} from 'react'
import {RouterContextValue} from './types'
import {useRouter} from './useRouter'

/**
 * A higher-order component that injects the `router` object from the `useRouter` hook
 * into the props of the wrapped component.
 *
 * @public
 *
 * @param Component - The component to wrap.
 * @returns The wrapped component.
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
  /**
   * The `router` object from the `useRouter` hook.
   */
  router: RouterContextValue
  /**
   * A function that renders the wrapped component with the `router` object as a parameter.
   *
   * @param router - The `router` object from the `useRouter` hook.
   * @returns - The rendered component.
   */
  children: (router: RouterContextValue) => React.ReactElement
}

/**
 * A component that renders the wrapped component with the `router` object from the `useRouter` hook
 * injected into its props.
 *
 * @public
 *
 * @param props - Props to pass to the wrapped component.
 * @returns The rendered component.
 *
 */
export const WithRouter = withRouter((props: WithRouterProps) => props.children(props.router))
