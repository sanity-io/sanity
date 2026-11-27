import {onTestFinished} from 'vitest'

interface StartViewTransitionOptions {
  update?: () => unknown
  types?: string[]
}

/** One view transition React started: its types, and the elements it named */
export interface PicturedViewTransition {
  types: string[]
  /** The elements named as the old state is pictured, by `data-testid` or else tag name */
  old: string[]
  /** The elements named once the update has run, by `data-testid` or else tag name */
  new: string[]
}

function namedElements(): string[] {
  return Array.from(document.body.querySelectorAll<HTMLElement>('*'))
    .filter((element) => {
      const name = element.style.getPropertyValue('view-transition-name')
      return name !== '' && name !== 'none'
    })
    .map((element) => element.dataset.testid ?? element.tagName.toLowerCase())
    .toSorted()
}

/**
 * Stands in for the browser's view transitions, which jsdom lacks, so React takes the path it takes
 * in a browser: the update runs on the next microtask and the animations end at once. Returns the
 * transitions React starts, with the elements it names for each. Removed when the test finishes.
 */
export function stubViewTransitions(): PicturedViewTransition[] {
  const pictured: PicturedViewTransition[] = []
  const startViewTransition = (options: StartViewTransitionOptions) => {
    const picture: PicturedViewTransition = {
      types: [...(options.types ?? [])],
      old: namedElements(),
      new: [],
    }
    pictured.push(picture)
    const updateCallbackDone = (async () => {
      await Promise.resolve()
      await options.update?.()
      picture.new = namedElements()
    })()
    const ready = updateCallbackDone.then(() => undefined)
    return {updateCallbackDone, ready, finished: ready, skipTransition: () => {}}
  }
  const root = document.documentElement
  const stubs: [object, string, unknown][] = [
    [document, 'startViewTransition', startViewTransition],
    [document, 'fonts', {status: 'loaded', ready: Promise.resolve()}],
    [root, 'getAnimations', () => []],
    [root, 'animate', () => ({cancel: () => {}, finished: Promise.resolve()})],
  ]
  // react-dom escapes the names it gives the boundaries of a transition with `CSS.escape`
  const escape = (value: string) => value.replace(/[^\w-]/g, '\\$&')
  if (typeof globalThis.CSS === 'undefined') {
    stubs.push([globalThis, 'CSS', {escape}])
  } else if (typeof CSS.escape !== 'function') {
    stubs.push([CSS, 'escape', escape])
  }
  for (const [target, key, value] of stubs) {
    Object.defineProperty(target, key, {configurable: true, value})
  }
  onTestFinished(() => {
    for (const [target, key] of stubs) Reflect.deleteProperty(target, key)
  })
  return pictured
}

/** The elements named in any of the transitions, old state or new */
export function namedInTransitions(pictured: PicturedViewTransition[]): string[] {
  return [...new Set(pictured.flatMap((picture) => [...picture.old, ...picture.new]))].toSorted()
}
