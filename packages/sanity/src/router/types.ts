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
   * Optionally disable scoping of search params
   * Scoped search params will be represented as scope[param]=value in the url
   * Disabling this will still scope search params based on any parent scope unless the parent scope also has disabled search params scoping
   * Caution: enabling this can cause conflicts with multiple plugins defining search params with the same name
   */
  __unsafe_disableScopedSearchParams?: boolean

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
export type InternalSearchParam = [scopedPath: string[], value: string]

/** @internal */
export interface MatchOk {
  type: 'ok'
  node: RouterNode
  matchedState: Record<string, string>
  searchParams: InternalSearchParam[]
  child: MatchOk | undefined
}

/** @internal */
export interface MatchError {
  type: 'error'
  node: RouterNode
  /**
   * Parameters found in the route string but not provided as a key in the state object
   */
  missingKeys: string[]
  /**
   * These are keys found in the state object but not in the route definition (and can't be mapped to a child route)
   */
  unmappableStateKeys: string[]
}
/** @internal */
export type MatchResult = MatchError | MatchOk

/**
 * @public
 */
export interface NavigateBaseOptions {
  replace?: boolean
}

/**
 * @public
 */
export interface NavigateOptions extends NavigateBaseOptions {
  stickyParams?: Record<string, string | undefined | null>
}

/**
 * @public
 */
export interface NavigateOptionsWithState extends NavigateOptions {
  state?: RouterState | null
}

/**
 * @public
 */
export interface RouterContextValue {
  /**
   * Resolves the path from the given router state. See {@link RouterState}
   *
   * When state is null, it will resolve the path from the current state
   * and navigate to the root path.
   */
  resolvePathFromState: (state: RouterState | null) => string

  /**
   * Resolves the intent link for the given intent name and parameters.
   * See {@link IntentParameters}
   */
  resolveIntentLink: (
    intentName: string,
    params?: IntentParameters,
    searchParams?: SearchParam[],
  ) => string

  /**
   * Navigates to the given URL.
   * The function requires an object that has a path and an optional replace property.
   */
  navigateUrl: (opts: {path: string; replace?: boolean}) => void

  /**
   * @deprecated Use `navigate({stickyParams: params, ...options})` instead
   */
  navigateStickyParams: (
    params: NavigateOptions['stickyParams'],
    options?: NavigateBaseOptions,
  ) => void

  /**
   * Updates the router state and navigates to a new path.
   * Allows specifying new state values and optionally merging sticky parameters.
   *
   * See {@link RouterState} and {@link NavigateOptions}
   *
   * @public
   *
   * @example Navigate with sticky params only, staying on the current path
   * ```tsx
   * router.navigate({stickyParams: {baz: 'qux'}})
   * ```
   * @remarks `null` sticky parameter value will remove the sticky parameter from the url
   *
   * @example Navigate with state and sticky params
   * ```tsx
   * router.navigate({stickyParams: {baz: 'qux'}, state: {foo: 'bar'}})
   * ```
   *
   * @example Navigate to root path
   * ```tsx
   * router.navigate({stickyParams: {baz: 'qux'}, state: null})
   * ```
   */
  navigate: {
    // legacy, state-first version - for when you want to navigate to a new state
    (nextState: RouterState, options?: NavigateOptions): void
    // Options version - for staying where you are (omit state) or going to root (state: null)
    (options: NavigateOptions & {state?: RouterState | null}): void
  }

  /**
   * Navigates to the given intent.
   * See {@link RouterState} and {@link NavigateBaseOptions}
   */
  navigateIntent: (
    intentName: string,
    params?: IntentParameters,
    options?: NavigateBaseOptions,
  ) => void

  /**
   * The current router state. See {@link RouterState}
   */
  state: RouterState

  /**
   * The current router state. See {@link RouterState}
   */
  stickyParams: Record<string, string | undefined | null>
}

/**
 * Base intent parameters
 *
 * @public
 * @todo dedupe with core/structure
 */
export interface BaseIntentParams {
  /**
   * Document schema type name to create/edit.
   * Required for `create` intents, optional for `edit` (but encouraged, safer and faster)
   */
  type?: string

  /**
   * ID of the document to create/edit.
   * Required for `edit` intents, optional for `create`.
   */
  id?: string

  /* Name (ID) of initial value template to use for `create` intent. Optional.  */
  template?: string

  /**
   * Experimental field path
   *
   * @beta
   * @experimental
   * @hidden
   */
  path?: string

  /**
   * Optional "mode" to use for edit intent.
   * Known modes are `structure` and `presentation`.
   */
  mode?: string

  /**
   * Arbitrary/custom parameters are generally discouraged - try to keep them to a minimum,
   * or use `payload` (arbitrary JSON-serializable object) instead.
   */
  [key: string]: string | undefined
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
export type SearchParam = [key: string, value: string]

/**
 * @public
 */
export type RouterState = Record<string, unknown> & {_searchParams?: SearchParam[]}

export const isNavigateOptions = (
  maybeNavigateOptions: unknown,
): maybeNavigateOptions is NavigateOptions & {state?: RouterState | null} => {
  if (
    typeof maybeNavigateOptions !== 'object' ||
    maybeNavigateOptions === null ||
    Array.isArray(maybeNavigateOptions)
  ) {
    return false
  }

  const hasNavigationProps =
    'replace' in maybeNavigateOptions ||
    'stickyParams' in maybeNavigateOptions ||
    'state' in maybeNavigateOptions

  if (!hasNavigationProps) {
    return false
  }

  // if state exists then it should be of RouterState type
  if ('state' in maybeNavigateOptions) {
    const {state} = maybeNavigateOptions as {state: unknown}
    // allow null or undefined or RouterState (including empty object)
    return state === null || state === undefined || typeof state === 'object'
  }

  return true
}

/**
 * Type representing either a new router state or navigation options with an optional state.
 * @internal
 */
export type NextStateOrOptions = RouterState | (NavigateOptions & {state?: RouterState | null})
