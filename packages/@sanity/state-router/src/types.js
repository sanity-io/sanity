// @flow

export type Segment = {
  name: string,
  type: 'dir' | 'param'
}

export type Transform<T> = {
  toState: (value: string) => T,
  toPath: (value: T) => string
}

export type Route = {
  raw: string,
  segments: Segment[]
}

// eslint-disable-next-line no-use-before-define
export type RouteChildren = Node[] | ((state: Object) => Node[])

export type Node = {
  route: Route,
  scope?: string,
  transform?: {[key: string]: Transform<*>},
  children: RouteChildren
}

export type Router = Node & {
  encode: (state: Object) => string,
  decode: (path: string) => ?Object,
  isNotFound: (path: string) => boolean,
  getBasePath: () => string,
  getRedirectBase: (pathname: string) => ?string,
  isRoot: (path: string) => boolean
}
export type MatchResult = {
  nodes: Node[],
  missing: string[],
  remaining: string[]
}
