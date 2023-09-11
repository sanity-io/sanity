/**
 * @public
 */
export interface RouteSegment {
  /**
   * The name of the segment.
   */
  name: string
  /**
   * The type of the segment.
   * Can be either "dir" or "param".
   */
  type: 'dir' | 'param'
}

/**
 * @public
 */
export interface RouteTransform<T> {
  /**
   * Converts a path string to a state object.
   */
  toState: (value: string) => T

  /**
   * Converts a state object to a path string.
   */
  toPath: (value: T) => string
}

/**
 * @public
 */
export interface Route {
  /**
   * The raw string representation of the route.
   */
  raw: string
  /**
   * An array of route segments that make up the route.
   * See {@link RouteSegment}
   */
  segments: RouteSegment[]
  /**
   * An optional object containing route transforms.
   * See {@link RouteTransform} and {@link RouterState}
   */
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
  /**
   * The route information for this node. See {@link Route}
   */
  route: Route
  /**
   * An optional scope for this node.
   */
  scope?: string
  /**
   * An optional object containing transforms to apply to this node.
   * See {@link RouteTransform} and {@link RouterState}
   */
  transform?: {
    [key: string]: RouteTransform<RouterState>
  }
  /**
   * The child nodes of this node. See {@link RouteChildren}
   */
  children: RouteChildren
}

/**
 * @public
 */
export interface Router extends RouterNode {
  /**
   * Indicates whether this router is a route.
   * @internal
   */
  _isRoute: boolean
  /**
   * Encodes the specified router state into a path string.
   * See {@link RouterState}
   *
   */
  encode: (state: RouterState) => string

  /**
   * Decodes the specified path string into a router state.
   * See {@link RouterState}
   */
  decode: (path: string) => RouterState | null

  /**
   * Determines whether the specified path is not found.
   */
  isNotFound: (path: string) => boolean

  /**
   * Gets the base path of this router.
   */
  getBasePath: () => string

  /**
   * Gets the redirect base of this router.
   */
  getRedirectBase: (pathname: string) => string | null

  /**
   * Determines whether the specified path is the root path.
   */
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
export interface NavigateOptions {
  /**
   * Indicates whether to replace the current state.
   */
  replace?: boolean

  /** @internal */
  searchParams?: Record<string, string>
}

/**
 * @public
 * @todo dedupe with intent types in core
 */
export interface BaseIntentParams {
  /* Intent type */
  type?: string
  /* Intent Id */
  id?: string
  /* Intent template */
  template?: string
  /**
   * Experimental field path
   * @beta
   * @experimental
   * @hidden
   */
  path?: string
}

/**
 * Intent parameters (json)
 *
 * @public
 */
export type IntentJsonParams = {[key: string]: any}

/**
 * @public
 * @todo dedupe with intent types in core
 */
export type IntentParameters = BaseIntentParams | [BaseIntentParams, IntentJsonParams]

/**
 * @public
 */
export type RouterState = Record<string, unknown>

/**
 * @public
 */
export interface RouterContextValue {
  /**
   * Resolves the path from the given router state. See {@link RouterState}
   */
  resolvePathFromState: (nextState: RouterState) => string

  /**
   * Resolves the intent link for the given intent name and parameters.
   * See {@link IntentParameters}
   */
  resolveIntentLink: (intentName: string, params?: IntentParameters) => string

  /**
   * Navigates to the given URL.
   * The function requires an object that has a path and an optional replace property.
   */
  navigateUrl: (opts: {
    path: string
    replace?: boolean
    /** @internal */
    searchParams?: Record<string, string | undefined>
  }) => void

  /**
   * Navigates to the given router state.
   * See {@link RouterState} and {@link NavigateOptions}
   */
  navigate: (nextState: RouterState, options?: NavigateOptions) => void

  /**
   * Navigates to the given intent.
   * See {@link RouterState} and {@link NavigateOptions}
   */
  navigateIntent: (intentName: string, params?: IntentParameters, options?: NavigateOptions) => void

  /**
   * @internal
   */
  searchParams: Record<string, string | undefined>

  /**
   * The current router state. See {@link RouterState}
   */
  state: RouterState
}
