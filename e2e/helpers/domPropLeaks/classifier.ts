import {type DomPropVocabulary} from './vocabulary'

/**
 * - `react`: a prop react-dom's development build warns about.
 * - `styled-components`: a prop a styled tag passes to the DOM although `@emotion/is-prop-valid`
 *   rejects it, which is what styled-components warns about in development.
 * - `object-value`: an object React stringifies into a `[object Object]` attribute.
 * - `unknown-attribute`: a plain lowercase name that no check above catches, which React writes
 *   to the DOM as an attribute without a word (`intent="edit"`).
 */
export type DomPropRule = 'react' | 'styled-components' | 'object-value' | 'unknown-attribute'

export interface DomPropHost {
  /** The element type React created (`fiber.type`): `div`, `clipPath`, `my-element`. */
  type: string
  props: Record<string, unknown>
  /** A styled-components styled tag without `shouldForwardProp` rendered the element. */
  styledTag?: boolean
  /**
   * Whether the element exposes the (lowercased) name as a property, which is how the
   * `unknown-attribute` rule accepts attributes React's table does not list, such as `loading`
   * on `<img>` or the global `slot` and `part`.
   */
  reflects?: (lowerCasedName: string) => boolean
}

export interface DomPropIssue {
  rule: DomPropRule
  prop: string
  message: string
}

export type DomPropClassifier = (host: DomPropHost) => DomPropIssue[]

/**
 * Build the check the DOM prop leak scanner runs on the props of every element React renders.
 * The first rule that matches a prop reports it:
 *
 * 1. `react`: `ReactDOMInvalidARIAHook`, `ReactDOMUnknownPropertyHook` and
 *    `isAttributeNameSafe`, ported from react-dom's development build with the same messages,
 *    so a production build fails on the props `sanity dev` logs. `classifier.test.ts` checks the
 *    port against react-dom itself.
 * 2. `styled-components`, for elements a styled tag rendered.
 * 3. `object-value`.
 * 4. `unknown-attribute`, for elements no styled tag rendered (for those, rule 2 already
 *    covers every name `@emotion/is-prop-valid` does not know).
 *
 * This runs in the browser as the serialized source of the function, so it must not reference
 * anything outside its own body.
 */
export function createDomPropClassifier(vocabulary: DomPropVocabulary): DomPropClassifier {
  const hasOwn = (object: object, key: string) => Object.prototype.hasOwnProperty.call(object, key)
  const toRegExp = (pattern: {source: string; flags: string}) =>
    new RegExp(pattern.source, pattern.flags)

  const standardNames = vocabulary.standardNames
  const possibleEventProps = vocabulary.possibleEventProps
  const ariaAttributes = new Set(vocabulary.ariaAttributes)
  const eventProps = new Set(vocabulary.eventProps)
  const extraAttributes = new Set(vocabulary.extraAttributes)
  const validAttributeName = toRegExp(vocabulary.patterns.validAttributeName)
  const aria = toRegExp(vocabulary.patterns.aria)
  const ariaCamel = toRegExp(vocabulary.patterns.ariaCamel)
  const eventName = toRegExp(vocabulary.patterns.eventName)
  const reactPropsRegex = toRegExp(vocabulary.patterns.isPropValid)

  // The lists `validateProperty` in react-dom hard-codes: props that may be booleans, and the
  // boolean attributes it warns about when they get the string "true" or "false".
  const booleanProps = new Set([
    'autoFocus',
    'checked',
    'multiple',
    'muted',
    'selected',
    'contentEditable',
    'spellCheck',
    'draggable',
    'value',
    'autoReverse',
    'externalResourcesRequired',
    'focusable',
    'preserveAlpha',
    'allowFullScreen',
    'async',
    'autoPlay',
    'controls',
    'credentialless',
    'default',
    'defer',
    'disabled',
    'disablePictureInPicture',
    'disableRemotePlayback',
    'formNoValidate',
    'hidden',
    'loop',
    'noModule',
    'noValidate',
    'open',
    'playsInline',
    'readOnly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'itemScope',
    'capture',
    'download',
    'inert',
  ])
  const booleanAttributes = new Set([
    'checked',
    'selected',
    'multiple',
    'muted',
    'allowFullScreen',
    'async',
    'autoPlay',
    'controls',
    'credentialless',
    'default',
    'defer',
    'disabled',
    'disablePictureInPicture',
    'disableRemotePlayback',
    'formNoValidate',
    'hidden',
    'loop',
    'noModule',
    'noValidate',
    'open',
    'playsInline',
    'readOnly',
    'required',
    'reversed',
    'scoped',
    'seamless',
    'itemScope',
    'inert',
  ])
  const unvalidatedProps = new Set([
    'dangerouslySetInnerHTML',
    'children',
    'style',
    'suppressContentEditableWarning',
    'suppressHydrationWarning',
    'defaultValue',
    'defaultChecked',
    'innerHTML',
    'ref',
    'innerText',
    'textContent',
  ])
  // Props React handles itself instead of writing them as attributes.
  const nonAttributeProps = new Set([...unvalidatedProps, 'autoFocus', 'multiple', 'muted'])
  const hyphenatedNativeElements = new Set([
    'annotation-xml',
    'color-profile',
    'font-face',
    'font-face-src',
    'font-face-uri',
    'font-face-format',
    'font-face-name',
    'missing-glyph',
  ])
  const plainLowercaseName = /^[a-z][a-z0-9]*$/

  const isCustomElement = (type: string) =>
    type.includes('-') && !hyphenatedNativeElements.has(type)
  // `setProp` treats these as event listeners and never writes them as attributes.
  const isEventLike = (name: string) =>
    name.length > 2 && (name[0] === 'o' || name[0] === 'O') && (name[1] === 'n' || name[1] === 'N')
  // `@emotion/is-prop-valid`
  const isPropValid = (name: string) =>
    reactPropsRegex.test(name) ||
    (name.charCodeAt(0) === 111 && name.charCodeAt(1) === 110 && name.charCodeAt(2) < 91)

  function ariaMessage(type: string, name: string): string | null {
    if (ariaCamel.test(name)) {
      const ariaName = `aria-${name.slice(4).toLowerCase()}`
      if (!ariaAttributes.has(ariaName)) {
        return `Invalid ARIA attribute \`${name}\`. ARIA attributes follow the pattern aria-* and must be lowercase.`
      }
      if (name !== ariaName) {
        return `Invalid ARIA attribute \`${name}\`. Did you mean \`${ariaName}\`?`
      }
    }
    if (aria.test(name)) {
      const lowerCasedName = name.toLowerCase()
      if (!ariaAttributes.has(lowerCasedName)) {
        return `Invalid aria prop \`${name}\` on <${type}> tag. For details, see https://react.dev/link/invalid-aria-props`
      }
      if (name !== lowerCasedName) {
        return `Unknown ARIA attribute \`${name}\`. Did you mean \`${lowerCasedName}\`?`
      }
    }
    return null
  }

  function unknownPropertyMessage(type: string, name: string, value: unknown): string | null {
    const lowerCasedName = name.toLowerCase()
    if (lowerCasedName === 'onfocusin' || lowerCasedName === 'onfocusout') {
      return 'React uses onFocus and onBlur instead of onFocusIn and onFocusOut. All React events are normalized to bubble, so onFocusIn and onFocusOut are not needed/supported by React.'
    }
    if (
      typeof value === 'function' &&
      ((type === 'form' && name === 'action') ||
        ((type === 'input' || type === 'button') && name === 'formAction'))
    ) {
      return null
    }
    if (eventProps.has(name)) return null
    if (hasOwn(possibleEventProps, lowerCasedName)) {
      return `Invalid event handler property \`${name}\`. Did you mean \`${possibleEventProps[lowerCasedName]}\`?`
    }
    if (eventName.test(name)) {
      return `Unknown event handler property \`${name}\`. It will be ignored.`
    }
    if (aria.test(name) || ariaCamel.test(name)) return null
    if (lowerCasedName === 'innerhtml') {
      return 'Directly setting property `innerHTML` is not permitted. For more information, lookup documentation on `dangerouslySetInnerHTML`.'
    }
    if (lowerCasedName === 'aria') {
      return 'The `aria` attribute is reserved for future use in React. Pass individual `aria-` attributes instead.'
    }
    if (
      lowerCasedName === 'is' &&
      value !== null &&
      value !== undefined &&
      typeof value !== 'string'
    ) {
      return `Received a \`${typeof value}\` for a string attribute \`is\`. If this is expected, cast the value to a string.`
    }
    if (typeof value === 'number' && Number.isNaN(value)) {
      return `Received NaN for the \`${name}\` attribute. If this is expected, cast the value to a string.`
    }
    if (hasOwn(standardNames, lowerCasedName)) {
      const standardName = standardNames[lowerCasedName]
      if (standardName !== name) {
        return `Invalid DOM property \`${name}\`. Did you mean \`${standardName}\`?`
      }
    } else if (name !== lowerCasedName) {
      return `React does not recognize the \`${name}\` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase \`${lowerCasedName}\` instead. If you accidentally passed it from a parent component, remove it from the DOM element.`
    }
    if (unvalidatedProps.has(name)) return null
    switch (typeof value) {
      case 'boolean': {
        const prefix = lowerCasedName.slice(0, 5)
        if (booleanProps.has(name) || prefix === 'data-' || prefix === 'aria-') return null
        const message = `Received \`${value}\` for a non-boolean attribute \`${name}\`.\n\nIf you want to write it to the DOM, pass a string instead: ${name}="${value}" or ${name}={value.toString()}.`
        return value
          ? message
          : `${message}\n\nIf you used to conditionally omit it with ${name}={condition && value}, pass ${name}={condition ? value : undefined} instead.`
      }
      case 'function':
      case 'symbol':
        return `Invalid value for prop \`${name}\` on <${type}> tag. Either remove it from the element, or pass a string or number value to keep it in the DOM. For details, see https://react.dev/link/attribute-behavior `
      case 'string':
        if ((value === 'false' || value === 'true') && booleanAttributes.has(name)) {
          const consequence =
            value === 'false'
              ? 'The browser will interpret it as a truthy value.'
              : 'Although this works, it will not work as expected if you pass the string "false".'
          return `Received the string \`${value}\` for the boolean attribute \`${name}\`. ${consequence} Did you mean ${name}={${value}}?`
        }
        return null
      default:
        return null
    }
  }

  return function classify(host) {
    const {type, props} = host
    const custom = isCustomElement(type)
    const validatesUnknownProps = !custom && typeof props.is !== 'string'
    const styledTag =
      host.styledTag === true &&
      type.charAt(0) === type.charAt(0).toLowerCase() &&
      !type.includes('-')
    const issues: DomPropIssue[] = []

    for (const name of Object.keys(props)) {
      const value = props[name]

      const reactMessage =
        ariaMessage(type, name) ??
        (validatesUnknownProps ? unknownPropertyMessage(type, name, value) : null) ??
        (!custom && value !== null && value !== undefined && !isEventLike(name)
          ? validAttributeName.test(name)
            ? null
            : `Invalid attribute name: \`${name}\``
          : null)
      if (reactMessage !== null) {
        issues.push({rule: 'react', prop: name, message: reactMessage})
        continue
      }

      if (
        styledTag &&
        value !== undefined &&
        name !== 'ref' &&
        name !== 'as' &&
        name[0] !== '$' &&
        !isPropValid(name)
      ) {
        issues.push({
          rule: 'styled-components',
          prop: name,
          message: `styled-components: it looks like an unknown prop "${name}" is being sent through to the DOM, which will likely trigger a React console error.`,
        })
        continue
      }

      if (custom || nonAttributeProps.has(name) || isEventLike(name)) continue

      const objectValue = value !== null && typeof value === 'object'
      const unknownAttribute =
        !styledTag &&
        plainLowercaseName.test(name) &&
        (objectValue ||
          typeof value === 'string' ||
          typeof value === 'number' ||
          typeof value === 'bigint') &&
        !hasOwn(standardNames, name) &&
        !isPropValid(name) &&
        !extraAttributes.has(name) &&
        !host.reflects?.(name)
      if (!objectValue && !unknownAttribute) continue

      let text: string
      try {
        text = String(value)
      } catch {
        // Not stringifiable: React throws when it sets the attribute, which surfaces as a page error.
        continue
      }
      if (objectValue && text === '[object Object]') {
        issues.push({
          rule: 'object-value',
          prop: name,
          message: `\`${name}\` is an object, which React writes to the DOM as ${name}="[object Object]".`,
        })
      } else if (unknownAttribute) {
        issues.push({
          rule: 'unknown-attribute',
          prop: name,
          message: `\`${name}\` is not an HTML or SVG attribute, but React writes it to the DOM as ${name}="${text.length > 60 ? `${text.slice(0, 57)}...` : text}".`,
        })
      }
    }
    return issues
  }
}
