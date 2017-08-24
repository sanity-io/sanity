import Multicast from '@sanity/observable/multicast'
import Observable from '@sanity/observable'

import resize$ from './resize'
import scroll$ from './scroll'
import orientationChange$ from './orientationChange'

const ROOT_MARGIN_PX = 150

/*
  Adapted from the polyfill at https://github.com/WICG/IntersectionObserver
*/
function isIntersectionObserverSupported() {
  if ('IntersectionObserver' in window
    && 'IntersectionObserverEntry' in window
    && 'intersectionRatio' in IntersectionObserverEntry.prototype) {

    // Minimal polyfill for Edge 15's lack of `isIntersecting`
    // See: https://github.com/WICG/IntersectionObserver/issues/211
    if (!('isIntersecting' in IntersectionObserverEntry.prototype)) {
      Object.defineProperty(IntersectionObserverEntry.prototype, 'isIntersecting', {
        get() {
          return this.intersectionRatio > 0
        }
      })
    }
    return true
  }
  return false
}

export default isIntersectionObserverSupported()
  ? createIntersectionObserverBased()
  : createLegacyBased()

function createIntersectionObserverBased() {
  const intersectionObserverEntries$$ = new Multicast()
  const intersectionObserver = new IntersectionObserver(callback, {
    threshold: 0,
    rootMargin: `${ROOT_MARGIN_PX}px`
  })

  function callback(entries) {
    entries.forEach(entry => {
      intersectionObserverEntries$$.next(entry)
    })
  }

  return function intersectionObservableFor(element) {
    return new Observable(observer => {
      intersectionObserver.observe(element)
      observer.next()
      return () => intersectionObserver.unobserve(element)
    })
      .mergeMap(() => intersectionObserverEntries$$.asObservable())
      .filter(event => event.target === element)
  }
}

// This can be removed when intersection observer are supported by the browsers we support
function createLegacyBased() {
  function getViewport() {
    return {
      left: 0,
      right: window.innerWidth,
      top: 0,
      bottom: window.innerHeight
    }
  }

  function intersects(rect, viewport, margin) {
    return (
      rect.left <= viewport.right + margin
      && rect.right >= viewport.left - margin
      && rect.top <= viewport.bottom + margin
      && rect.bottom >= viewport.top - margin
    )
  }

  function inViewport(element) {
    return () => intersects(element.getBoundingClientRect(), getViewport(), ROOT_MARGIN_PX)
  }

  return function intersectionObservableFor(element) {
    const isElementInViewport = inViewport(element)
    return Observable.of(isElementInViewport())
      .merge(resize$.merge(scroll$))
      .merge(orientationChange$)
      .map(isElementInViewport)
      // todo: consider "faking" more of the IntersectionObserverEntry api if possible
      .map(isIntersecting => ({isIntersecting}))
  }

}
