import {_parseRoute} from './_parseRoute'
import {_resolveStateFromPath} from './_resolveStateFromPath'
import {_resolvePathFromState} from './_resolvePathFromState'
import {RouteTransform, Router, RouteChildren} from './types'
import {decodeJsonParams, encodeJsonParams} from './utils/jsonParamsEncoding'
import {decodeParams, encodeParams} from './utils/paramsEncoding'

/**
 * @public
 */
export type RouteNodeOptions = {
  path?: string
  children?: RouteChildren
  transform?: {
    [key: string]: RouteTransform<any>
  }
  scope?: string
}

/**
 * @public
 */
export const route: {
  create: (
    routeOrOpts: RouteNodeOptions | string,
    childrenOrOpts?: RouteNodeOptions | RouteChildren | null,
    children?: Router | RouteChildren
  ) => Router
  intents: (base: string) => Router
  scope: (scopeName: string, ...rest: any[]) => Router
} = {create: createRoute, scope: routeScope, intents: routeIntents}

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
  children?: Router | RouteChildren
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

function createRoute(
  routeOrOpts: RouteNodeOptions | string,
  childrenOrOpts?: RouteNodeOptions | RouteChildren | null,
  children?: Router | RouteChildren
): Router {
  return createNode(normalizeArgs(routeOrOpts, childrenOrOpts, children))
}

function routeScope(scopeName: string, ...rest: any[]): Router {
  const options = normalizeArgs(...rest)

  return createNode({
    ...options,
    scope: scopeName,
  })
}

function normalize(...paths: string[]) {
  return paths.reduce<string[]>((acc, path) => acc.concat(path.split('/')), []).filter(Boolean)
}

function routeIntents(base: string): Router {
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
      ]
    ),
  ])
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
