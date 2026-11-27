import {beforeEach, describe, expect, onTestFinished, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {
  ColorSchemeLocalStorageProvider,
  useColorSchemeSetValue,
  useColorSchemeValue,
} from '../colorScheme'

const LOCAL_STORAGE_KEY = 'sanityStudio:ui:colorScheme'

interface ViewTransitionCall {
  types: string[]
  /** The document's `color-scheme` as the old state is pictured */
  colorSchemeBefore: string
  /** The document's `color-scheme` once React has applied the update */
  colorSchemeAfter: string
  /** Whether React kept the document root's crossfade, which it cancels with `none` */
  rootViewTransitionName: string
}

/**
 * Stands in for the browser's view transitions, so the test can read what React hands them. The
 * update runs on the next microtask and the animations end at once, as when a transition is skipped
 */
function stubViewTransitions() {
  const calls: ViewTransitionCall[] = []
  const root = document.documentElement
  const startViewTransition = vi.fn((options: StartViewTransitionOptions) => {
    const colorSchemeBefore = root.style.colorScheme
    const updateCallbackDone = (async () => {
      await Promise.resolve()
      await options.update?.()
      calls.push({
        types: [...(options.types ?? [])],
        colorSchemeBefore,
        colorSchemeAfter: root.style.colorScheme,
        rootViewTransitionName: root.style.viewTransitionName,
      })
    })()
    const ready = updateCallbackDone.then(() => undefined)
    return {
      updateCallbackDone,
      ready,
      finished: ready,
      skipTransition: () => {},
      types: new Set(options.types),
    }
  })
  const stubs: [object, string, unknown][] = [
    [document, 'startViewTransition', startViewTransition],
    [root, 'getAnimations', () => []],
  ]
  for (const [target, key, value] of stubs) {
    Object.defineProperty(target, key, {configurable: true, value})
  }
  onTestFinished(() => {
    for (const [target, key] of stubs) Reflect.deleteProperty(target, key)
  })
  return calls
}

/**
 * Calls its `change` listeners the way the browser does for an OS appearance change, with a
 * microtask checkpoint after each one. A `dispatchEvent` call from script runs them all at once.
 */
class PrefersDarkMediaQueryList extends EventTarget implements MediaQueryList {
  readonly media = '(prefers-color-scheme: dark)'
  matches = false
  onchange = null
  #listeners = new Set<EventListenerOrEventListenerObject>()
  override addEventListener(_type: string, listener: EventListenerOrEventListenerObject | null) {
    if (listener) this.#listeners.add(listener)
  }
  override removeEventListener(_type: string, listener: EventListenerOrEventListenerObject | null) {
    if (listener) this.#listeners.delete(listener)
  }
  async change(matches: boolean) {
    this.matches = matches
    const event = new Event('change')
    for (const listener of this.#listeners) {
      if (typeof listener === 'function') listener(event)
      else listener.handleEvent(event)
      await Promise.resolve()
    }
  }
  addListener() {}
  removeListener() {}
}

/** Lets the test flip the OS appearance, and optionally turn on reduced motion */
function stubMediaQueries({reducedMotion = false}: {reducedMotion?: boolean} = {}) {
  const prefersDarkList = new PrefersDarkMediaQueryList()
  const matchMedia = window.matchMedia.bind(window)
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    if (query === '(prefers-color-scheme: dark)') return prefersDarkList
    if (query === '(prefers-reduced-motion: reduce)') {
      return matchMedia(reducedMotion ? 'all' : 'not all')
    }
    return matchMedia(query)
  })
  onTestFinished(() => {
    vi.restoreAllMocks()
  })
  return {
    setPrefersDark: (next: boolean) => prefersDarkList.change(next),
  }
}

function ColorSchemeHarness() {
  const scheme = useColorSchemeValue()
  const setScheme = useColorSchemeSetValue()
  return (
    <>
      <output data-testid="scheme">{scheme}</output>
      <button type="button" onClick={() => setScheme && setScheme('dark')}>
        Dark
      </button>
    </>
  )
}

const scheme = () => document.querySelector('[data-testid="scheme"]')?.textContent

describe.skipIf(!CSS.supports('(view-transition-name: test)'))('color scheme transitions', () => {
  beforeEach(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'light')
    onTestFinished(() => {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
      document.documentElement.style.removeProperty('color-scheme')
    })
  })

  test('changing the scheme crossfades the whole page', async () => {
    stubMediaQueries()
    const transitions = stubViewTransitions()
    await render(
      <ColorSchemeLocalStorageProvider>
        <ColorSchemeHarness />
      </ColorSchemeLocalStorageProvider>,
    )
    expect(scheme()).toBe('light')

    await page.getByRole('button', {name: 'Dark'}).click()

    await expect.poll(scheme).toBe('dark')
    expect(transitions).toEqual([
      {
        types: ['sanity-color-scheme'],
        colorSchemeBefore: 'light',
        colorSchemeAfter: 'dark',
        rootViewTransitionName: '',
      },
    ])
  })

  test('with reduced motion the scheme changes without a view transition', async () => {
    stubMediaQueries({reducedMotion: true})
    const transitions = stubViewTransitions()
    await render(
      <ColorSchemeLocalStorageProvider>
        <ColorSchemeHarness />
      </ColorSchemeLocalStorageProvider>,
    )

    await page.getByRole('button', {name: 'Dark'}).click()

    await expect.poll(scheme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(transitions).toEqual([])
  })

  test('an OS appearance change in system mode crossfades from the old scheme', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEY, 'system')
    const mediaQueries = stubMediaQueries()
    const transitions = stubViewTransitions()
    await render(
      <ColorSchemeLocalStorageProvider>
        <ColorSchemeHarness />
      </ColorSchemeLocalStorageProvider>,
    )
    expect(scheme()).toBe('light')

    await mediaQueries.setPrefersDark(true)

    await expect.poll(scheme).toBe('dark')
    expect(transitions).toEqual([
      {
        types: ['sanity-color-scheme'],
        colorSchemeBefore: 'light',
        colorSchemeAfter: '',
        rootViewTransitionName: '',
      },
    ])
  })
})
