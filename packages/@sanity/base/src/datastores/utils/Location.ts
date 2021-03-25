// Location implementation which keeps overlapping props in sync, e.g. host / hostname, and search / query
import url from 'url'

export interface Location {
  query: string
  hostname: string
  port: string
  pathname: string
  protocol: string
  slashes: boolean
  search: string
  hash: string
}

export function configure(
  {qsImpl} = {qsImpl: require('querystring')}
): {parse: (urlToParse: string) => Location; stringify: (location: Location) => string} {
  class LocationImpl {
    query: string
    hostname: string
    port: string
    pathname: string
    protocol: string
    slashes: boolean
    hash: string

    get search() {
      const stringified = qsImpl.stringify(this.query || {})
      return stringified.length > 1 ? `?${stringified}` : null
    }
    set search(newSearch) {
      this.query = qsImpl.parse(newSearch.replace(/^\?/, ''))
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
        query: qsImpl.parse(parsed.search.substring(1)),
      })
    }

    get href() {
      return url.format(this)
    }

    set href(newHref) {
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
      Object.assign(new Location(), this)
    }
    extend(properties) {
      return Object.assign(new Location(), this, properties)
    }
  }

  return {
    parse(urlToParse): Location {
      return Object.assign(new LocationImpl(), {
        href: urlToParse,
      })
    },
    stringify(location: Location) {
      return url.format({
        protocol: location.protocol,
        slashes: location.slashes,
        hostname: location.hostname,
        pathname: location.pathname,
        port: location.port,
        search: location.search,
        hash: location.hash,
      })
    },
  }
}

export default configure()
