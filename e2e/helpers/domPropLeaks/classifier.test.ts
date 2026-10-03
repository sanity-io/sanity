import vm from 'node:vm'

import {describe, expect, test} from 'vitest'

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

// `validatePropertiesInDevelopment` also warns about these, which are not about prop names.
const OTHER_WARNINGS = /^error: (?:`value` prop on|A component is `contentEditable`)/

/** What react-dom's development build logs for `<type name={value} />`, as `level: message`. */
function reactDomWarnings(type: string, name: string, value: unknown): string[] {
  const warnings: string[] = []
  react.resetWarnings()
  const restore = react.setConsoleSink((level, args) => {
    const warning = `${level}: ${formatConsoleArgs(args)}`
    if (!OTHER_WARNINGS.test(warning)) warnings.push(warning)
  })
  try {
    react.validatePropertiesInDevelopment(type, {[name]: value})
    // `setProp` writes every other prop with a value as an attribute, checking its name first.
    const isEventLike =
      name.length > 2 &&
      (name[0] === 'o' || name[0] === 'O') &&
      (name[1] === 'n' || name[1] === 'N')
    if (!react.isCustomElement(type) && value !== null && value !== undefined && !isEventLike) {
      react.isAttributeNameSafe(react.getAttributeAlias(name))
    }
  } finally {
    restore()
  }
  return warnings
}

describe('createDomPropClassifier', () => {
  test('flags a prop exactly when react-dom warns about it, with one of its messages', () => {
    const mismatches: string[] = []
    for (const type of TYPES) {
      for (const name of NAMES) {
        for (const value of VALUES) {
          const expected = reactDomWarnings(type, name, value)
          const actual = classify({type, props: {[name]: value}})
            .filter((issue) => issue.rule === 'react')
            .map((issue) => `error: ${issue.message}`)
          const agrees =
            expected.length === 0
              ? actual.length === 0
              : actual.length === 1 && expected.includes(actual[0])
          if (!agrees) {
            mismatches.push(
              `<${type} ${JSON.stringify(name)}={${describeValue(value)}}>: react-dom ${JSON.stringify(expected)}, classifier ${JSON.stringify(actual)}`,
            )
          }
        }
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

  test('runs from its serialized source, as the init script runs it', () => {
    const serialized = vm.runInNewContext(
      `(${createDomPropClassifier.toString()})`,
    ) as typeof createDomPropClassifier
    const isolated = serialized(JSON.parse(JSON.stringify(vocabulary)))
    for (const type of ['div', 'my-element']) {
      for (const name of NAMES) {
        for (const value of VALUES) {
          const host = {type, props: {[name]: value}, styledTag: type === 'div'}
          expect(JSON.stringify(isolated(host))).toBe(JSON.stringify(classify(host)))
        }
      }
    }
  })
})
