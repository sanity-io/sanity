// Originally from https://github.com/kenchris/urlpattern-polyfill/blob/039357b28b68e3d68f59d7c6af0138cd25a91914/src/types.d.ts#L1C1-L49C2
// The `options` constructor overloads are part of the URLPattern spec
// (https://urlpattern.spec.whatwg.org/#urlpattern) and supported by both native implementations
// and urlpattern-polyfill, but missing from the polyfill's shipped types.

declare type URLPatternInput = URLPatternInit | string
declare class URLPattern {
  constructor(init?: URLPatternInput, baseURL?: string, options?: URLPatternOptions)
  constructor(init?: URLPatternInit, options?: URLPatternOptions)

  test(input?: URLPatternInput, baseURL?: string): boolean

  exec(input?: URLPatternInput, baseURL?: string): URLPatternResult | null

  readonly protocol: string
  readonly username: string
  readonly password: string
  readonly hostname: string
  readonly port: string
  readonly pathname: string
  readonly search: string
  readonly hash: string
}
declare interface URLPatternOptions {
  ignoreCase?: boolean
}

declare interface URLPatternInit {
  baseURL?: string
  username?: string
  password?: string
  protocol?: string
  hostname?: string
  port?: string
  pathname?: string
  search?: string
  hash?: string
}

declare interface URLPatternResult {
  inputs: [URLPatternInput]
  protocol: URLPatternComponentResult
  username: URLPatternComponentResult
  password: URLPatternComponentResult
  hostname: URLPatternComponentResult
  port: URLPatternComponentResult
  pathname: URLPatternComponentResult
  search: URLPatternComponentResult
  hash: URLPatternComponentResult
}

declare interface URLPatternComponentResult {
  input: string
  groups: {
    [key: string]: string | undefined
  }
}
