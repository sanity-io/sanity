// Vitest setup module: fail the current test when a prop reached a DOM element it should not
// have. Three detectors feed one `afterEach` assertion:
//
// 1. react-dom's development-build `console.error` diagnostics (unknown camelCase props, bad
//    boolean/function values, misspelled attributes, event handlers and ARIA names), listed in
//    `reactDomPropWarnings.mjs`.
// 2. styled-components' "unknown prop is being sent through to the DOM" `console.warn`.
// 3. `Element.prototype.setAttribute` receiving an object: react-dom validates neither the name
//    nor the value of an all-lowercase unknown prop (`params={{…}}` renders silently as
//    `params="[object Object]"`, `tags={['a', 'b']}` as `tags="a,b"`), so the attribute write is
//    the only trace such a leak leaves.
//
// Register it through `setupFiles`, or import it from an existing setup file. Works in jsdom and
// in vitest browser mode alike — both run the development build of react-dom, which is the only
// build that emits these diagnostics. The production studio silences them, so an e2e run against
// a `sanity build` output cannot see them; the unit and browser-mode suites are where they surface
// in CI. React prints each warning once per prop name per module instance, which is once per test
// file here (the forks pool and browser mode both isolate modules per file).
import {afterEach} from 'vitest'

import {isReactDomPropWarning} from './reactDomPropWarnings.mjs'

/**
 * React only validates camelCase / boolean / function props; an all-lowercase unknown prop such
 * as `intent` is rendered as an attribute without a word. styled-components (`console.warn`)
 * catches that case for every `styled.<tag>`, which every `@sanity/ui` primitive bottoms out in.
 * It only warns when `process.env.NODE_ENV === 'development'`, so under vitest (`test`) this
 * pattern is a no-op and the e2e watcher against `sanity dev` is where it fires; it is matched
 * here so a run with `NODE_ENV=development` fails the same way.
 */
export const STYLED_COMPONENTS_UNKNOWN_PROP_PATTERN =
  /styled-components: it looks like an unknown prop "[^"]+" is being sent through to the DOM/

/**
 * What a plain object turns into as an attribute value. Lowercase leaks such as
 * `params={{type: 'author'}}` produce no console output at all, so the attribute value is the only
 * trace they leave; no real attribute ever holds this string.
 */
export const OBJECT_ATTRIBUTE_VALUE = '[object Object]'

/**
 * @param {unknown} value
 * @returns {string}
 */
function stringify(value) {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.stack || value.message
  try {
    return String(value)
  } catch {
    return '[unprintable]'
  }
}

/**
 * Substitute React's `%s` placeholders so the failure message reads like the browser console.
 * Extra arguments (React appends the component stack as one) are joined onto the end.
 *
 * @param {unknown[]} args
 * @returns {string}
 */
export function formatConsoleMessage(args) {
  const [first, ...rest] = args
  if (typeof first !== 'string') return args.map(stringify).join(' ')
  let index = 0
  const message = first.replace(/%[sdifoOc]/g, (match) => {
    if (match === '%c') return ''
    return index < rest.length ? stringify(rest[index++]) : match
  })
  return [message, ...rest.slice(index).map(stringify)].join('\n')
}

/**
 * @param {unknown[]} args - the arguments passed to `console.warn`
 * @returns {boolean}
 */
export function isStyledComponentsUnknownPropWarning(args) {
  const message = args[0]
  return typeof message === 'string' && STYLED_COMPONENTS_UNKNOWN_PROP_PATTERN.test(message)
}

/** @type {string[]} */
const captured = []

/**
 * Returns the DOM prop warnings reported so far in the current test and clears them, so a test
 * that leaks a prop on purpose can assert on the report instead of failing.
 *
 * @returns {string[]}
 */
export function takeDomPropWarnings() {
  return captured.splice(0)
}

const originalError = console.error
console.error = (...args) => {
  if (isReactDomPropWarning(args)) {
    captured.push(formatConsoleMessage(args))
  }
  originalError(...args)
}

const originalWarn = console.warn
console.warn = (...args) => {
  if (isStyledComponentsUnknownPropWarning(args)) {
    captured.push(formatConsoleMessage(args))
  }
  originalWarn(...args)
}

/**
 * react-dom hands every attribute value to `setAttribute` as it is and lets the DOM convert it, so
 * any object counts (a plain object, an array, a `Date`), and so does a plain object that was
 * already converted to a string on its way there.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isObjectAttributeValue(value) {
  return value === OBJECT_ATTRIBUTE_VALUE || (typeof value === 'object' && value !== null)
}

/**
 * The attribute value the DOM writes for `value`, followed by the kind of object when that string
 * does not show it (`"a,b" (Array)`).
 *
 * @param {unknown} value
 * @returns {string}
 */
function describeAttributeValue(value) {
  let text
  try {
    text = String(value)
  } catch {
    text = '[unprintable]'
  }
  if (text.length > 60) text = `${text.slice(0, 57)}...`
  const kind =
    typeof value === 'object' && value !== null && text !== OBJECT_ATTRIBUTE_VALUE
      ? ` (${Object.prototype.toString.call(value).slice(8, -1)})`
      : ''
  return `"${text}"${kind}`
}

if (typeof Element !== 'undefined') {
  const {setAttribute} = Element.prototype
  Element.prototype.setAttribute = function patchedSetAttribute(name, value) {
    if (isObjectAttributeValue(value)) {
      captured.push(
        `Attribute \`${name}\` on <${this.tagName.toLowerCase()}> was set to ${describeAttributeValue(value)}: an object-valued prop reached the DOM element.`,
      )
    }
    return setAttribute.call(this, name, value)
  }
}

afterEach(() => {
  const messages = takeDomPropWarnings()
  if (messages.length === 0) return
  throw new Error(
    [
      `${messages.length} DOM prop warning(s) were reported during this test. A non-DOM prop reached a DOM element (or an attribute is misspelled). Strip or rename the prop (styled-components: use a transient \`$prop\`) before it is spread onto the element.`,
      '',
      ...messages.map((message, i) => `[${i + 1}] ${message}`),
    ].join('\n'),
  )
})
