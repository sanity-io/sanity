import {createDomPropClassifier, type DomPropClassifier, type DomPropRule} from './classifier'
import {type DomPropVocabulary} from './vocabulary'

/** Prefix of the console messages the scanner reports each new finding with. */
export const DOM_PROP_LEAK_MARKER = '__SANITY_DOM_PROP_LEAK__'

export interface DomPropLeakFinding {
  rule: DomPropRule
  prop: string
  message: string
  /** The element type React created. */
  tag: string
  /** The nearest components above the element, outermost first. */
  components: string[]
  /** Opening tag of the first element the leak was found on. */
  element: string
  url: string
}

export interface DomPropLeakScan {
  findings: DomPropLeakFinding[]
  /** Elements checked, and how many of them carried React props (a props update counts again). */
  stats: {elements: number; reactElements: number}
  /** Whether `#sanity`, the studio's React root, has rendered anything. */
  studioRendered: boolean
  /** The scanner itself threw; the scan is incomplete. */
  error: string | null
}

interface ScannerConfig {
  marker: string
  maxFindings: number
  /** Minimum milliseconds between rescans of the whole document while the DOM keeps changing. */
  rescanInterval: number
  /** Rescans wait at least this many times as long as the previous rescan took. */
  rescanCostFactor: number
}

export type ScannerWindow = Window & {__sanityDomPropLeakScanner?: {scan: () => DomPropLeakScan}}

/**
 * Installs `window.__sanityDomPropLeakScanner`, which checks the props React gave each element
 * with `createClassifier(vocabulary)`. React keeps them on the element as `__reactProps$<id>`
 * (and its fiber as `__reactFiber$<id>`) in development and production builds alike, so this
 * works against the production studio CI deploys, where react-dom's own warnings are stripped.
 *
 * Elements are checked when they are added, when one of their attributes (other than `style`)
 * changes, and in a rescan of the whole document while the DOM changes, which catches props
 * updated without a DOM change (a leaked boolean, say). Rescans are spaced so they take at most
 * `1 / rescanCostFactor` of the main thread. A props object is checked once. `scan()` checks
 * what is left and returns every finding so far, and each new finding is also logged with
 * `config.marker` so findings on documents that are navigated away from are not lost.
 *
 * Serialized into an init script, so it must not reference anything outside its own body.
 */
function installDomPropLeakScanner(
  createClassifier: (vocabulary: DomPropVocabulary) => DomPropClassifier,
  vocabulary: DomPropVocabulary,
  config: ScannerConfig,
): void {
  const scannerWindow = window as ScannerWindow
  if (scannerWindow.__sanityDomPropLeakScanner) return

  // Captured before the page's own scripts run, so page code (and Playwright's clock) cannot
  // change them underneath the scanner.
  const log = console.debug.bind(console)
  const now = performance.now.bind(performance)

  const PROPS_PREFIX = '__reactProps$'
  const FIBER_PREFIX = '__reactFiber$'
  const classify = createClassifier(vocabulary)
  const checkedProps = new WeakMap<Element, unknown>()
  const notReact = new WeakSet<Element>()
  const reflectedNames = new WeakMap<object, Set<string>>()
  const findings = new Map<string, DomPropLeakFinding>()
  const stats = {elements: 0, reactElements: 0}
  let propsKey: string | null = null
  let fiberKey = ''
  let nextRescan = 0
  let error: string | null = null

  type Fiber = {
    tag: number
    type: unknown
    elementType: unknown
    return: Fiber | null
  }
  type Named = {displayName?: unknown; name?: unknown; render?: unknown; type?: unknown}

  function findPropsKey(element: Element): string | null {
    if (propsKey !== null && propsKey in element) return propsKey
    for (const key of Object.keys(element)) {
      if (key.startsWith(PROPS_PREFIX)) {
        propsKey = key
        fiberKey = FIBER_PREFIX + key.slice(PROPS_PREFIX.length)
        return key
      }
    }
    return null
  }

  function reflects(element: Element, name: string): boolean {
    const prototype = Object.getPrototypeOf(element) as object
    let names = reflectedNames.get(prototype)
    if (!names) {
      names = new Set()
      for (
        let object: object | null = prototype;
        object && object !== Object.prototype;
        object = Object.getPrototypeOf(object) as object | null
      ) {
        const descriptors = Object.getOwnPropertyDescriptors(object)
        for (const key of Object.keys(descriptors)) {
          if (!descriptors[key].get) continue
          const lowerCasedKey = key.toLowerCase()
          names.add(lowerCasedKey)
          // `interestfor` is reflected as `interestForElement`, `commandfor` as `commandForElement`.
          if (lowerCasedKey.endsWith('element')) names.add(lowerCasedKey.slice(0, -7))
        }
      }
      reflectedNames.set(prototype, names)
    }
    return names.has(name)
  }

  // A bundler renames a component whose name clashes with another one in the same chunk to
  // `Name$1`. Report the name as it reads in the source, as a development build does.
  const BUNDLER_SUFFIX = /\$\d+$/

  function nameOf(value: unknown): string | null {
    if ((typeof value !== 'function' && typeof value !== 'object') || value === null) return null
    const {displayName, name} = value as Named
    let found: string | null = null
    if (typeof displayName === 'string' && displayName) found = displayName
    else if (typeof name === 'string' && name) found = name
    return found && (found.replace(BUNDLER_SUFFIX, '') || found)
  }

  function componentName(fiber: Fiber): string | null {
    switch (fiber.tag) {
      // FunctionComponent, ClassComponent
      case 0:
      case 1:
        return nameOf(fiber.type)
      // ForwardRef: styled-components sets `displayName` on the forwardRef object.
      case 11:
        return nameOf(fiber.elementType) ?? nameOf((fiber.type as Named | null)?.render)
      // MemoComponent, SimpleMemoComponent
      case 14:
      case 15: {
        const memo = fiber.elementType as Named | null
        return nameOf(memo) ?? nameOf(memo?.type) ?? nameOf((memo?.type as Named | null)?.render)
      }
      default:
        return null
    }
  }

  function componentsOf(fiber: Fiber | undefined): string[] {
    const names: string[] = []
    for (let node = fiber?.return, depth = 0; node && depth < 60 && names.length < 8; depth++) {
      const name = componentName(node)
      if (name && name !== names[names.length - 1]) names.push(name)
      node = node.return
    }
    return names.reverse()
  }

  function describeElement(element: Element): string {
    let text = `<${element.localName}`
    for (const attribute of Array.from(element.attributes)) {
      const value =
        attribute.value.length > 40 ? `${attribute.value.slice(0, 37)}...` : attribute.value
      text += ` ${attribute.name}="${value}"`
    }
    text += '>'
    return text.length > 300 ? `${text.slice(0, 297)}...` : text
  }

  function check(element: Element): void {
    stats.elements++
    if (notReact.has(element)) return
    const key = findPropsKey(element)
    if (key === null) {
      notReact.add(element)
      return
    }
    const props = (element as unknown as Record<string, unknown>)[key]
    if (props === null || typeof props !== 'object' || checkedProps.get(element) === props) return
    checkedProps.set(element, props)
    stats.reactElements++

    const fiber = (element as unknown as Record<string, Fiber | undefined>)[fiberKey]
    const type = typeof fiber?.type === 'string' ? fiber.type : element.localName
    const styled = fiber?.return?.elementType as
      | {styledComponentId?: unknown; shouldForwardProp?: unknown}
      | null
      | undefined
    const issues = classify({
      type,
      props: props as Record<string, unknown>,
      styledTag:
        typeof styled === 'object' &&
        styled !== null &&
        typeof styled.styledComponentId === 'string' &&
        typeof styled.shouldForwardProp !== 'function',
      reflects: (name) => reflects(element, name),
    })
    if (issues.length === 0) return

    const components = componentsOf(fiber)
    for (const issue of issues) {
      const id = [issue.rule, type, issue.prop, components.join('>')].join('|')
      if (findings.has(id) || findings.size >= config.maxFindings) continue
      const finding: DomPropLeakFinding = {
        ...issue,
        tag: type,
        components,
        element: describeElement(element),
        url: location.href,
      }
      findings.set(id, finding)
      log(config.marker + JSON.stringify(finding))
    }
  }

  function checkTree(root: Element): void {
    check(root)
    const descendants = root.getElementsByTagName('*')
    for (let index = 0; index < descendants.length; index++) check(descendants[index])
  }

  function rescan(): void {
    const start = now()
    if (document.documentElement) checkTree(document.documentElement)
    const end = now()
    nextRescan = end + Math.max(config.rescanInterval, (end - start) * config.rescanCostFactor)
  }

  function guarded(run: () => void): void {
    if (error !== null) return
    try {
      run()
    } catch (caught) {
      error = caught instanceof Error ? (caught.stack ?? caught.message) : String(caught)
    }
  }

  function processRecords(records: MutationRecord[]): void {
    for (const record of records) {
      if (record.type === 'childList') {
        for (const node of Array.from(record.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE) checkTree(node as Element)
        }
      } else if (record.attributeName !== 'style' && record.target.nodeType === Node.ELEMENT_NODE) {
        check(record.target as Element)
      }
    }
    if (now() >= nextRescan) rescan()
  }

  const observer = new MutationObserver((records) => guarded(() => processRecords(records)))
  observer.observe(document, {childList: true, subtree: true, attributes: true})

  function scanEverything(): void {
    processRecords(observer.takeRecords())
    rescan()
  }

  window.addEventListener('pagehide', () => guarded(scanEverything), {capture: true})

  scannerWindow.__sanityDomPropLeakScanner = {
    scan() {
      guarded(scanEverything)
      const root = document.getElementById('sanity')
      return {
        findings: [...findings.values()],
        stats: {...stats},
        studioRendered: root !== null && root.firstElementChild !== null,
        error,
      }
    },
  }
}

/** The init script that installs the scanner in every document of a browser context. */
export function buildDomPropLeakScannerScript(vocabulary: DomPropVocabulary): string {
  const config: ScannerConfig = {
    marker: DOM_PROP_LEAK_MARKER,
    maxFindings: 100,
    rescanInterval: 1000,
    rescanCostFactor: 20,
  }
  return `(${installDomPropLeakScanner.toString()})(${createDomPropClassifier.toString()}, ${JSON.stringify(vocabulary)}, ${JSON.stringify(config)})`
}
