import url from 'url'
import qs, {ParsedQs} from 'qs'

export interface Location {
  query: ParsedQs
  hostname: string
  port: string
  pathname: string
  protocol: string
  slashes: boolean
  search: string | null
  hash: string | null
  auth: string | null
}

export interface LocationController {
  parse: (href: string) => Location
  stringify: (location: Location) => string
}

/**
 * Location implementation which keeps overlapping props in sync, e.g. host / hostname, and search / query
 */
export function createLocationController(opts?: {
  qsImpl?: {parse: (str: string) => ParsedQs; stringify: (obj: ParsedQs) => string}
}): LocationController {
  const {qsImpl = qs} = opts || {}

  class LocationImpl {
    auth: string | null = null
    query = {}
    hostname = ''
    port = ''
    pathname = ''
    protocol = ''
    slashes = false
    hash: string | null = null

    get search(): string | null {
      const stringified = qsImpl.stringify(this.query || {})

      return stringified.length > 1 ? `?${stringified}` : null
    }

    set search(newSearch: string | null) {
      this.query = typeof newSearch === 'string' ? qsImpl.parse(newSearch.replace(/^\?/, '')) : ''
    }

    get host() {
      return this.port ? `${this.hostname}:${this.port}` : this.hostname
    }

    set host(newVal) {
      const [hostname, port] = newVal.split(':')

      Object.assign(this, {
        hostname: hostname,
        port: port,
      })
    }

    get path() {
      return this.pathname + (this.search || '')
    }

    set path(newPath) {
      const parsed = url.parse(newPath, false, false)

      Object.assign(this, {
        pathname: parsed.pathname,
        query: qsImpl.parse(parsed.search?.substring(1) || ''),
      })
    }

    get href() {
      return url.format(this)
    }

    set href(newHref: string) {
      const parsed = url.parse(newHref, false, false)

      Object.assign(this, {
        protocol: parsed.protocol,
        slashes: parsed.slashes,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        port: parsed.port,
        auth: parsed.auth,
        query: qsImpl.parse((parsed.search || '').substring(1)),
        hash: parsed.hash,
      })
    }

    clone() {
      return Object.assign(new LocationImpl(), this)
    }

    extend(properties: Record<string, unknown>) {
      return Object.assign(this.clone(), properties)
    }
  }

  function parse(href: string): Location {
    const loc = new LocationImpl()

    loc.href = href

    return loc
  }

  function stringify(location: Location) {
    return url.format({
      protocol: location.protocol,
      slashes: location.slashes,
      hostname: location.hostname,
      pathname: location.pathname,
      port: location.port,
      search: location.search,
      hash: location.hash,
    })
  }

  return {parse, stringify}
}
