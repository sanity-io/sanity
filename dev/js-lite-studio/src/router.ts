/**
 * Routes with the JS structure tool's shape (`/<workspace>/structure/<type>;<id>`), under
 * `BASE_PATH`, on the History API.
 */
import {type MouseEvent} from 'react'

import {BASE_PATH, WORKSPACE} from './config'
import {parsePerspective, type Perspective, perspectiveParam} from './perspective'
import {Atom} from './state'

export interface Route {
  typeName?: string
  documentId?: string
}

const PREFIX = `${BASE_PATH}/${WORKSPACE}/structure`

export function parseRoute(pathname: string): Route {
  if (!pathname.startsWith(PREFIX)) return {}
  const pane = pathname
    .slice(PREFIX.length)
    .split('/')
    .find((segment) => segment.length > 0)
  if (!pane) return {}
  const separator = pane.indexOf(';')
  const decode = (part: string) => {
    try {
      return decodeURIComponent(part)
    } catch {
      return part
    }
  }
  const typeName = separator === -1 ? pane : pane.slice(0, separator)
  const documentId = separator === -1 ? '' : pane.slice(separator + 1)
  return {
    typeName: typeName ? decode(typeName) : undefined,
    documentId: documentId ? decode(documentId) : undefined,
  }
}

export function routeHref(route: Route): string {
  let href = PREFIX
  if (route.typeName) {
    href += `/${route.typeName}`
    if (route.documentId) href += `;${route.documentId}`
  }
  return href
}

/** The same location in the JS studio, for comparing the two. */
export function jsStudioHref(route: Route): string {
  return routeHref(route).slice(BASE_PATH.length)
}

export function sameRoute(a: Route, b: Route): boolean {
  return a.typeName === b.typeName && a.documentId === b.documentId
}

function searchPerspective(): Perspective {
  return parsePerspective(new URLSearchParams(window.location.search).get('perspective'))
}

export const route = new Atom<Route>(parseRoute(window.location.pathname))
export const perspective = new Atom<Perspective>(searchPerspective())

/** `href` with the perspective parameter, which navigation keeps like the JS studio does. */
export function withPerspective(href: string): string {
  const param = perspectiveParam(perspective.get())
  return param ? `${href}?perspective=${encodeURIComponent(param)}` : href
}

export function installRouter(): void {
  if (!window.location.pathname.startsWith(PREFIX)) {
    // Keeps the query and the hash, where a login hands over the credentials `auth` reads.
    window.history.replaceState(
      null,
      '',
      `${routeHref({})}${window.location.search}${window.location.hash}`,
    )
    route.set({})
  }
  window.addEventListener('popstate', () => {
    const next = searchPerspective()
    if (perspectiveParam(next) !== perspectiveParam(perspective.get())) perspective.set(next)
    route.set(parseRoute(window.location.pathname))
  })
}

export function navigate(next: Route): void {
  if (sameRoute(route.get(), next)) return
  window.history.pushState(null, '', withPerspective(routeHref(next)))
  route.set(next)
}

export function replace(next: Route): void {
  window.history.replaceState(null, '', withPerspective(routeHref(next)))
  route.set(next)
}

export function setPerspective(next: Perspective): void {
  if (perspectiveParam(next) === perspectiveParam(perspective.get())) return
  perspective.set(next)
  window.history.replaceState(null, '', withPerspective(window.location.pathname))
}

/** A click handler for links rendered with `href`: plain clicks navigate in place, modified
 * clicks (new tab, ...) are left to the browser. */
interface ClickLike {
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  button: number
  preventDefault: () => void
}

export function linkClick(next: Route) {
  return (event: ClickLike) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return
    event.preventDefault()
    navigate(next)
  }
}
