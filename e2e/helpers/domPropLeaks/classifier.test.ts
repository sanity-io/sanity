import vm from 'node:vm'

import {
  isReactDomPropWarning,
  REACT_DOM_PROP_WARNING_PATTERNS,
} from '@repo/test-config/vitest/reactDomPropWarnings'
import {describe, expect, test} from 'vitest'

import {REACT_DOM_PROP_WARNING} from '../studioErrors'
import {createDomPropClassifier} from './classifier'
import {loadReactDomInternals} from './reactDomInternals'
import {loadDomPropVocabulary, loadIsPropValid} from './vocabulary'

const react = loadReactDomInternals()
const vocabulary = loadDomPropVocabulary()
const classify = createDomPropClassifier(vocabulary)

const TYPES = ['div', 'a', 'input', 'button', 'form', 'svg', 'my-element', 'font-face']

const VALUES: unknown[] = [
  'x',
  'true',
  'false',
  '',
  0,
  1,
  Number.NaN,
  true,
  false,
  () => {},
  Symbol('value'),
  {},
  [],
  null,
  undefined,
]

const NAMES = [
  ...new Set([
    ...Object.keys(vocabulary.standardNames),
    ...Object.values(vocabulary.standardNames),
    ...vocabulary.ariaAttributes,
    ...vocabulary.ariaAttributes.map(
      (name) => `aria${name.charAt(5).toUpperCase()}${name.slice(6)}`,
    ),
    ...vocabulary.ariaAttributes.map((name) => name.toUpperCase()),
    ...vocabulary.eventProps,
    ...Object.keys(vocabulary.possibleEventProps),
    ...vocabulary.extraAttributes,
    // Props components in this repo leaked, and names each rule has a branch for.
    'intent',
    'params',
    'searchParams',
    'isOpen',
    'disableTransition',
    'tone',
    'fooBar',
    'FooBar',
    '$offset',
    'data-foo',
    'data-fooBar',
    'dataFoo',
    'aria',
    'aria-foo',
    'ariaFoo',
    'aria-labelledBy',
    'onFocusIn',
    'onfocusout',
    'onFoo',
    'onfoo',
    'on',
    'one',
    'onion',
    'ON',
    'innerHTML',
    'innerhtml',
    'is',
    'foo bar',
    'Foo Bar',
    '1abc',
    ':x',
    'a:b',
    'x.y',
    '-x',
    '_x',
    'x"y',
    'x>y',
    'x=y',
    'x/y',
    '',
    'popoverTarget',
    'fetchpriority',
    'action',
    'formAction',
  ]),
]

function formatConsoleArgs([template, ...args]: unknown[]): string {
  let index = 0
  return String(template).replace(/%s/g, () => String(args[index++]))
}

function describeValue(value: unknown): string {
  if (typeof value === 'function') return 'function'
  if (typeof value === 'symbol' || typeof value === 'number') return String(value)
  return JSON.stringify(value) ?? 'undefined'
}

// react-dom also logs these, which are not about prop names: the `value` and `contentEditable`
// checks of `validatePropertiesInDevelopment`, and the check that an event prop is a function.
const OTHER_WARNINGS =
  /^(?:`value` prop on|A component is `contentEditable`|Expected `[^`]+` listener to be a function)/

// What `setPropOnCustomElement` reads from the element: whether it has a property of the prop's
// name, and the methods it writes attributes and adds listeners with.
const fakeCustomElements = new Map(
  [false, true].map((hasProperty) => [
    hasProperty,
    new Proxy(
      {
        setAttribute() {},
        removeAttribute() {},
        hasAttribute: () => false,
        addEventListener() {},
        removeEventListener() {},
      },
      {has: () => hasProperty, set: () => true},
    ),
  ]),
)

interface ConsoleCall {
  level: string
  /** What react-dom passed to `console`: a format string, then the values for its `%s`. */
  args: unknown[]
  /** The format string with the values substituted, as the browser console prints it. */
  message: string
}

/** What react-dom's development build logs while `run` calls into it. */
function reactDomConsole(run: () => void): ConsoleCall[] {
  const calls: ConsoleCall[] = []
  react.resetWarnings()
  const restore = react.setConsoleSink((level, args) => {
    calls.push({level, args, message: formatConsoleArgs(args)})
  })
  try {
    run()
  } finally {
    restore()
  }
  return calls
}

/**
 * What react-dom's development build logs about the props when it creates `<type {...props} />`.
 * A custom element has a property for every prop when `hasProperty` is set, and for none
 * otherwise.
 */
function reactDomPropWarnings(
  type: string,
  props: Record<string, unknown>,
  hasProperty = false,
): ConsoleCall[] {
  return reactDomConsole(() => {
    react.validatePropertiesInDevelopment(type, props)
    for (const [name, value] of Object.entries(props)) {
      if (react.isCustomElement(type)) {
        if (value === undefined) continue
        try {
          react.setPropOnCustomElement(
            fakeCustomElements.get(hasProperty)!,
            type,
            name,
            value,
            props,
            undefined,
          )
        } catch {
          // `style` and `dangerouslySetInnerHTML` throw for values of the wrong shape.
        }
        continue
      }
      // `setProp` writes every other prop with a value as an attribute, checking its name first.
      const isEventLike =
        name.length > 2 &&
        (name[0] === 'o' || name[0] === 'O') &&
        (name[1] === 'n' || name[1] === 'N')
      if (value !== null && value !== undefined && !isEventLike) {
        react.isAttributeNameSafe(react.getAttributeAlias(name))
      }
    }
  }).filter((call) => !OTHER_WARNINGS.test(call.message))
}

/** Every combination of the types, names and values above, one prop at a time. */
function* singlePropCases() {
  for (const type of TYPES) {
    for (const hasProperty of react.isCustomElement(type) ? [false, true] : [false]) {
      for (const name of NAMES) {
        for (const value of VALUES) yield {type, hasProperty, name, value}
      }
    }
  }
}

describe('createDomPropClassifier', () => {
  test('flags a prop exactly when react-dom warns about it, with one of its messages', () => {
    const mismatches: string[] = []
    for (const {type, hasProperty, name, value} of singlePropCases()) {
      const expected = reactDomPropWarnings(type, {[name]: value}, hasProperty).map(
        (call) => `${call.level}: ${call.message}`,
      )
      const actual = classify({type, props: {[name]: value}, hasProperty: () => hasProperty})
        .filter((issue) => issue.rule === 'react')
        .map((issue) => `error: ${issue.message}`)
      const agrees =
        expected.length === 0
          ? actual.length === 0
          : actual.length === 1 && expected.includes(actual[0])
      if (!agrees) {
        mismatches.push(
          `<${type} ${JSON.stringify(name)}={${describeValue(value)}}>${hasProperty ? ' with that property' : ''}: react-dom ${JSON.stringify(expected)}, classifier ${JSON.stringify(actual)}`,
        )
      }
    }
    expect(mismatches.slice(0, 20)).toEqual([])
    expect(mismatches).toHaveLength(0)
  })

  test('flags props a styled tag passes on that @emotion/is-prop-valid rejects', () => {
    const {isPropValid} = loadIsPropValid()
    const mismatches: string[] = []
    for (const name of NAMES) {
      const issues = classify({type: 'div', props: {[name]: 'x'}, styledTag: true})
      if (issues.some((issue) => issue.rule === 'react')) continue
      // styled-components consumes `as` and transient `$` props instead of passing them on.
      const expected = !isPropValid(name) && name !== 'as' && !name.startsWith('$')
      if (issues.some((issue) => issue.rule === 'styled-components') !== expected) {
        mismatches.push(`${JSON.stringify(name)}: is-prop-valid says ${isPropValid(name)}`)
      }
    }
    expect(mismatches).toEqual([])
  })

  test('only applies the styled-components check to DOM tags a styled tag rendered', () => {
    expect(classify({type: 'div', props: {intent: 'edit'}, styledTag: true})).toEqual([
      expect.objectContaining({rule: 'styled-components', prop: 'intent'}),
    ])
    expect(classify({type: 'div', props: {intent: 'edit'}})).toEqual([
      expect.objectContaining({rule: 'unknown-attribute', prop: 'intent'}),
    ])
    expect(classify({type: 'my-element', props: {intent: 'edit'}, styledTag: true})).toEqual([])
    expect(
      classify({
        type: 'div',
        props: {ref: () => {}, as: 'a', $tone: null, tone: undefined},
        styledTag: true,
      }),
    ).toEqual([])
    // A transient prop that did reach the DOM is not a valid attribute name.
    expect(classify({type: 'div', props: {$tone: 'primary'}, styledTag: true})).toEqual([
      {rule: 'react', prop: '$tone', message: 'Invalid attribute name: `$tone`'},
    ])
  })

  test('flags plain lowercase names that are not attributes, unless the element reflects them', () => {
    expect(classify({type: 'a', props: {intent: 'edit', params: {id: 'a'}}})).toEqual([
      {
        rule: 'unknown-attribute',
        prop: 'intent',
        message:
          '`intent` is not an HTML or SVG attribute, but React writes it to the DOM as intent="edit".',
      },
      {
        rule: 'object-value',
        prop: 'params',
        message:
          '`params` is an object, which React writes to the DOM as params="[object Object]".',
      },
    ])
    expect(
      classify({
        type: 'img',
        props: {loading: 'lazy', slot: 'icon', decoding: 'async', closedby: 'any'},
        reflects: (name) => name === 'loading' || name === 'slot',
      }),
    ).toEqual([])
    expect(classify({type: 'div', props: {'data-intent': 'edit', 'aria-label': 'x'}})).toEqual([])
    // React throws when it writes one of these, which fails the test as a page error.
    expect(classify({type: 'div', props: {config: Object.create(null) as object}})).toEqual([])
    expect(classify({type: 'div', props: {tags: ['a', 'b']}})).toEqual([
      {
        rule: 'unknown-attribute',
        prop: 'tags',
        message:
          '`tags` is not an HTML or SVG attribute, but React writes it to the DOM as tags="a,b".',
      },
    ])
  })

  test('accepts a deliberate attribute only on the element its marker prop identifies', () => {
    expect(classify({type: 'div', props: {'data-pt-editor': true, 'zindex': -1}})).toEqual([])
    expect(classify({type: 'div', props: {zindex: -1}})).toEqual([
      {
        rule: 'unknown-attribute',
        prop: 'zindex',
        message:
          '`zindex` is not an HTML or SVG attribute, but React writes it to the DOM as zindex="-1".',
      },
    ])
  })

  test('does not report React-only props, event handlers or custom element props', () => {
    expect(
      classify({
        type: 'input',
        props: {
          children: 'x',
          style: {color: 'red'},
          dangerouslySetInnerHTML: {__html: ''},
          suppressHydrationWarning: true,
          defaultValue: 'x',
          autoFocus: true,
          onClick: () => {},
          onChange: () => {},
        },
      }),
    ).toEqual([])
    expect(classify({type: 'my-element', props: {config: {a: 1}, isOpen: true}})).toEqual([])
    expect(classify({type: 'div', props: {is: 'my-div', isOpen: true}})).toEqual([])
  })

  test('checks the name of a custom element prop that React writes as an attribute', () => {
    // React writes `true` without checking the name and adds an `on…` function as a listener.
    const props = {$tone: 'primary', $open: true, on$change: () => {}, config: {a: 1}}
    expect(classify({type: 'my-element', props, hasProperty: () => false})).toEqual([
      {rule: 'react', prop: '$tone', message: 'Invalid attribute name: `$tone`'},
    ])
    expect(classify({type: 'my-element', props, hasProperty: (name) => name === '$tone'})).toEqual(
      [],
    )
  })

  test('runs from its serialized source, as the init script runs it', () => {
    const serialized = vm.runInNewContext(
      `(${createDomPropClassifier.toString()})`,
    ) as typeof createDomPropClassifier
    const isolated = serialized(JSON.parse(JSON.stringify(vocabulary)))
    for (const type of ['div', 'my-element']) {
      for (const name of NAMES) {
        for (const value of VALUES) {
          const host = {
            type,
            props: {[name]: value},
            styledTag: type === 'div',
            hasProperty: () => false,
          }
          expect(JSON.stringify(isolated(host))).toBe(JSON.stringify(classify(host)))
        }
      }
    }
  })
})

describe('the react-dom warnings the test suites fail a test on', () => {
  test('match every warning react-dom logs about a prop, as each suite receives it', () => {
    const calls = [
      ...Array.from(singlePropCases(), ({type, hasProperty, name, value}) =>
        reactDomPropWarnings(type, {[name]: value}, hasProperty),
      ).flat(),
      // react-dom reports the invalid props of an element in one message.
      ...reactDomPropWarnings('div', {leakedfirst: () => {}, leakedsecond: Symbol('leaked')}),
      ...reactDomPropWarnings('div', {'aria-leakedfirst': 'x', 'aria-leakedsecond': 'x'}),
      // It checks the names and values in a `style` prop as it applies them.
      ...reactDomConsole(() =>
        react.setValueForStyles(
          {style: {setProperty() {}}},
          {
            'background-color': 'red',
            'webkitTransform': 'none',
            'width': Number.NaN,
            'height': Number.POSITIVE_INFINITY,
          },
          null,
        ),
      ),
    ]

    // Both suites check what react-dom passes to `console.error`.
    const unmatched = new Set<string>()
    for (const call of calls) {
      const checks = {
        'the vitest guard': isReactDomPropWarning(call.args),
        // Playwright's `msg.text()` joins the arguments of the call with spaces.
        'the e2e check of the arguments': REACT_DOM_PROP_WARNING.test(
          call.args.map(String).join(' '),
        ),
        'the e2e check of the printed message': REACT_DOM_PROP_WARNING.test(call.message),
      }
      const missedBy = Object.entries(checks)
        .filter(([, matched]) => !matched)
        .map(([check]) => check)
      if (call.level !== 'error' || missedBy.length > 0) {
        unmatched.add(
          `${call.level}: ${call.message.split('\n')[0]}${missedBy.length > 0 ? ` (missed by ${missedBy.join(', ')})` : ''}`,
        )
      }
    }
    expect([...unmatched]).toEqual([])

    const formats = [...new Set(calls.map((call) => String(call.args[0])))]
    const unused = REACT_DOM_PROP_WARNING_PATTERNS.filter(
      (pattern) => !formats.some((format) => pattern.test(format)),
    )
    expect(unused.map(String)).toEqual([])
  })
})
