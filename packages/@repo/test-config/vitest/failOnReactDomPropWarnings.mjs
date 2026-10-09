// Vitest setup module: fail the current test when a prop reached a DOM element it should not
// have. Three detectors feed one `afterEach` assertion:
//
// 1. react-dom's development-build `console.error` diagnostics (unknown camelCase props, bad
//    boolean/function values, misspelled attributes, event handlers and ARIA names).
// 2. styled-components' "unknown prop is being sent through to the DOM" `console.warn`.
// 3. `Element.prototype.setAttribute` receiving an object: react-dom validates neither the name
//    nor the value of an all-lowercase unknown prop (`params={{…}}` renders silently as
//    `params="[object Object]"`), so the attribute write is the only trace such a leak leaves.
//
// Register it through `setupFiles`, or import it from an existing setup file. Works in jsdom and
// in vitest browser mode alike — both run the development build of react-dom, which is the only
// build that emits these diagnostics. The production studio silences them, so an e2e run against
// a `sanity build` output cannot see them; the unit and browser-mode suites are where they surface
// in CI. React prints each warning once per prop name per module instance, which is once per test
// file here (the forks pool and browser mode both isolate modules per file).
import {afterEach} from 'vitest'

/**
 * The react-dom development-build diagnostics that mean a prop leaked to a DOM element:
 * unknown camelCase props, misspelled attributes, boolean/function/symbol values on attributes
 * that cannot hold them, misspelled event handlers, and bad ARIA attribute names. Matched against
 * the raw format string React passes to `console.error` (before `%s` substitution), so the
 * literal `%s` placeholders are part of the patterns.
 *
 * Source: react-dom `ReactDOMUnknownPropertyHook` / `validateProperty` and `ReactDOMInvalidARIAHook`.
 */
export const REACT_DOM_PROP_WARNING_PATTERNS = [
  /React does not recognize the `%s` prop on a DOM element/,
  /Invalid DOM property `%s`/,
  /Invalid value for prop `?%s`? on <%s> tag/,
  /Received `%s` for a non-boolean attribute `%s`/,
  /Received the string `%s` for the boolean attribute `%s`/,
  /Received NaN for the `%s` attribute/,
  /Unknown event handler property `%s`/,
  /Invalid event handler property `%s`/,
  /Invalid ARIA attribute `%s`/,
  /Invalid aria props? %s on <%s> tag/,
  /Unknown ARIA attribute `%s`/,
  /Invalid attribute name: `%s`/,
  /Unsupported style property %s/,
  /Unsupported vendor-prefixed style property %s/,
  /`NaN` is an invalid value for the `%s` css style property/,
]

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
 * What react-dom writes when an object-valued prop reaches an unknown attribute (`'' + value`).
 * Lowercase leaks such as `params={{type: 'author'}}` produce no console output at all, so the
 * attribute value is the only trace they leave; no real attribute ever holds this string.
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
 * @param {unknown[]} args - the arguments passed to `console.error`
 * @returns {boolean}
 */
export function isReactDomPropWarning(args) {
  const format = args[0]
  if (typeof format !== 'string') return false
  return REACT_DOM_PROP_WARNING_PATTERNS.some((pattern) => pattern.test(format))
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
 * react-dom hands the raw prop value to `setAttribute` and lets the DOM coerce it, so both the
 * object itself and an already-coerced string count.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isObjectAttributeValue(value) {
  if (value === OBJECT_ATTRIBUTE_VALUE) return true
  if (typeof value !== 'object' || value === null) return false
  try {
    return String(value) === OBJECT_ATTRIBUTE_VALUE
  } catch {
    return false
  }
}

if (typeof Element !== 'undefined') {
  const {setAttribute} = Element.prototype
  Element.prototype.setAttribute = function patchedSetAttribute(name, value) {
    if (isObjectAttributeValue(value)) {
      captured.push(
        `Attribute \`${name}\` on <${this.tagName.toLowerCase()}> was set to "${OBJECT_ATTRIBUTE_VALUE}": an object-valued prop reached the DOM element.`,
      )
    }
    return setAttribute.call(this, name, value)
  }
}

afterEach(() => {
  if (captured.length === 0) return
  const messages = captured.splice(0)
  throw new Error(
    [
      `${messages.length} DOM prop warning(s) were reported during this test. A non-DOM prop reached a DOM element (or an attribute is misspelled). Strip or rename the prop (styled-components: use a transient \`$prop\`) before it is spread onto the element.`,
      '',
      ...messages.map((message, i) => `[${i + 1}] ${message}`),
    ].join('\n'),
  )
})
