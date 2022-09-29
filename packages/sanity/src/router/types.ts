/**
 * @public
 */
export interface RouteSegment {
  name: string
  type: 'dir' | 'param'
}

/**
 * @public
 */
export interface RouteTransform<T> {
  toState: (value: string) => T
  toPath: (value: T) => string
}

/**
 * @public
 */
export interface Route {
  raw: string
  segments: RouteSegment[]
  transform?: {
    [key: string]: RouteTransform<RouterState>
  }
}

/**
 * @public
 */
export type RouteChildren =
  | RouterNode[]
  | ((state: RouterState) => Router | RouterNode | RouterNode[] | undefined | false)

/**
 * @public
 */
export interface RouterNode {
  route: Route
  scope?: string
  transform?: {
    [key: string]: RouteTransform<RouterState>
  }
  children: RouteChildren
}

/**
 * @public
 */
export interface Router extends RouterNode {
  _isRoute: boolean
  encode: (state: RouterState) => string
  decode: (path: string) => RouterState | null
  isNotFound: (path: string) => boolean
  getBasePath: () => string
  getRedirectBase: (pathname: string) => string | null
  isRoot: (path: string) => boolean
}

/** @internal */
export interface MatchResult {
  nodes: RouterNode[]
  missing: string[]
  remaining: string[]
}

/**
 * @public
 */
export type NavigateOptions = {
  replace?: boolean
}

/**
 * @public
 */
export type IntentParameters =
  | Record<string, unknown>
  | [Record<string, unknown>, Record<string, unknown>]

/**
 * @public
 */
export type RouterState = Record<string, unknown>

/**
 * @public
 */
export type RouterContextValue = {
  resolvePathFromState: (nextState: RouterState) => string
  resolveIntentLink: (intentName: string, params?: IntentParameters) => string
  navigateUrl: (opts: {path: string; replace?: boolean}) => void
  navigate: (nextState: RouterState, options?: NavigateOptions) => void
  navigateIntent: (intentName: string, params?: IntentParameters, options?: NavigateOptions) => void
  state: RouterState
}
