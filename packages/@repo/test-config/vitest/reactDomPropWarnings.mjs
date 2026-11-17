// The react-dom warnings `failOnReactDomPropWarnings.mjs` fails a test on. They live in a module
// of their own, without the guard's side effects, so the e2e suite can fail a test on the same
// warnings (`e2e/helpers/studioErrors.ts`) and check them against react-dom
// (`e2e/helpers/domPropLeaks/classifier.test.ts`).

/**
 * The react-dom development-build diagnostics that mean a prop leaked to a DOM element:
 * unknown camelCase props, misspelled attributes, boolean/function/symbol values on attributes
 * that cannot hold them, misspelled event handlers, bad ARIA attribute names, the `onFocusIn`,
 * `onFocusOut`, `innerHTML` and `aria` props React rejects, a non-string `is`, attribute names
 * the DOM cannot hold, and style properties and numbers React cannot apply. Matched against the
 * raw format string React passes to `console.error` (before `%s` substitution), so the literal
 * `%s` placeholders are part of the patterns.
 *
 * Source: react-dom `ReactDOMUnknownPropertyHook` / `validateProperty`, `ReactDOMInvalidARIAHook`,
 * `isAttributeNameSafe` and `setValueForStyle`.
 */
export const REACT_DOM_PROP_WARNING_PATTERNS = [
  /React does not recognize the `%s` prop on a DOM element/,
  /Invalid DOM property `%s`/,
  /Invalid value for prop `?%s`? on <%s> tag/,
  /Invalid values for props %s on <%s> tag/,
  /Received `%s` for a non-boolean attribute `%s`/,
  /Received the string `%s` for the boolean attribute `%s`/,
  /Received NaN for the `%s` attribute/,
  /Received a `%s` for a string attribute `is`/,
  /Unknown event handler property `%s`/,
  /Invalid event handler property `%s`/,
  /React uses onFocus and onBlur instead of onFocusIn and onFocusOut/,
  /Directly setting property `innerHTML` is not permitted/,
  /The `aria` attribute is reserved for future use in React/,
  /Invalid ARIA attribute `%s`/,
  /Invalid aria props? %s on <%s> tag/,
  /Unknown ARIA attribute `%s`/,
  /Invalid attribute name: `%s`/,
  /Unsupported style property %s/,
  /Unsupported vendor-prefixed style property %s/,
  /is an invalid value for the `%s` css style property/,
]

/**
 * @param {unknown[]} args - the arguments passed to `console.error`
 * @returns {boolean}
 */
export function isReactDomPropWarning(args) {
  const format = args[0]
  if (typeof format !== 'string') return false
  return REACT_DOM_PROP_WARNING_PATTERNS.some((pattern) => pattern.test(format))
}
