import {_parseRoute} from './_parseRoute'
import {_resolveStateFromPath} from './_resolveStateFromPath'
import {_resolvePathFromState} from './_resolvePathFromState'
import {RouteTransform, Router, RouteChildren} from './types'
import {decodeJsonParams, encodeJsonParams} from './utils/jsonParamsEncoding'
import {decodeParams, encodeParams} from './utils/paramsEncoding'

/**
 * @public
 */
export interface RouteNodeOptions {
  /**
   * The path of the route node.
   */
  path?: string
  /**
   * The children of the route node. See {@link RouteChildren}
   */
  children?: RouteChildren
  /**
   * The transforms to apply to the route node. See {@link RouteTransform}
   */
  transform?: {
    [key: string]: RouteTransform<any>
  }
  /**
   * The scope of the route node.
   */
  scope?: string
}

/**
 * Interface for the {@link route} object.
 *
 * @public
 */
export interface RouteObject {
  /**
   * Creates a new router.
   * Returns {@link Router}
   * See {@link RouteNodeOptions} and {@link RouteChildren}
   */
  create: (
    routeOrOpts: RouteNodeOptions | string,
    childrenOrOpts?: RouteNodeOptions | RouteChildren | null,
    children?: Router | RouteChildren,
  ) => Router

  /**
   * Creates a new router for handling intents.
   * Returns {@link Router}
   */
  intents: (base: string) => Router

  /**
   * Creates a new router scope.
   * Returns {@link Router}
   */
  scope: (scopeName: string, ...rest: any[]) => Router
}

/**
 * An object containing functions for creating routers and router scopes.
 * See {@link RouteObject}
 *
 * @public
 *
 * @example
 * ```ts
 * const router = route.create({
 *   path: "/foo",
 *   children: [
 *     route.create({
 *       path: "/bar",
 *       children: [
 *         route.create({
 *           path: "/:baz",
 *           transform: {
 *             baz: {
 *               toState: (id) => ({ id }),
 *               toPath: (state) => state.id,
 *             },
 *           },
 *         }),
 *       ],
 *     }),
 *   ],
 * });
 * ```
 */
export const route: RouteObject = {
  create: (routeOrOpts, childrenOrOpts, children) =>
    createNode(normalizeArgs(routeOrOpts, childrenOrOpts, children)),
  intents: (base: string) => {
    const basePath = normalize(base).join('/')

    return route.create(`${basePath}/:intent`, [
      route.create(
        ':params',
        {
          transform: {
            params: {
              toState: decodeParams,
              toPath: encodeParams,
            },
          },
        },
        [
          route.create(':payload', {
            transform: {
              payload: {
                toState: decodeJsonParams,
                toPath: encodeJsonParams,
              },
            },
          }),
        ],
      ),
    ])
  },
  scope: (scopeName, ...rest) => {
    const options = normalizeArgs(...rest)

    return createNode({
      ...options,
      scope: scopeName,
    })
  },
}

function normalizeChildren(children: any): RouteChildren {
  if (Array.isArray(children) || typeof children === 'function') {
    return children
  }
  return children ? [children] : []
}

function isRoute(val?: RouteNodeOptions | Router | RouteChildren) {
  return val && '_isRoute' in val
}

function normalizeArgs(...args: any[]): RouteNodeOptions
function normalizeArgs(
  path: string | RouteNodeOptions,
  childrenOrOpts?: RouteNodeOptions | Router | RouteChildren,
  children?: Router | RouteChildren,
): RouteNodeOptions {
  if (typeof path === 'object') {
    return path
  }

  if (
    Array.isArray(childrenOrOpts) ||
    typeof childrenOrOpts === 'function' ||
    isRoute(childrenOrOpts)
  ) {
    return {path, children: normalizeChildren(childrenOrOpts)}
  }

  if (children) {
    return {path, ...childrenOrOpts, children: normalizeChildren(children)}
  }

  return {path, ...childrenOrOpts}
}

function normalize(...paths: string[]) {
  return paths.reduce<string[]>((acc, path) => acc.concat(path.split('/')), []).filter(Boolean)
}

const EMPTY_STATE = {}

function isRoot(pathname: string): boolean {
  // it is the root if every segment is an empty string
  return pathname.split('/').every((segment) => !segment)
}

function createNode(options: RouteNodeOptions): Router {
  const {path, scope, transform, children} = options

  if (!path) {
    throw new TypeError('Missing path')
  }

  const parsedRoute = _parseRoute(path)

  return {
    _isRoute: true, // todo: make a Router class instead
    scope,
    route: parsedRoute,
    children: children || [],
    transform,
    encode(state) {
      return _resolvePathFromState(this, state)
    },
    decode(_path) {
      return _resolveStateFromPath(this, _path)
    },
    isRoot: isRoot,
    isNotFound(pathname: string): boolean {
      return this.decode(pathname) === null
    },
    getBasePath(): string {
      return this.encode(EMPTY_STATE)
    },
    getRedirectBase(pathname: string): string | null {
      if (isRoot(pathname)) {
        const basePath = this.getBasePath()
        // Check if basepath is something different than given
        if (pathname !== basePath) {
          return basePath
        }
      }
      return null
    },
  }
}
