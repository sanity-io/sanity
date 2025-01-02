import {type TFunction} from 'i18next'
import {type ComponentType, type ReactNode, useMemo} from 'react'

import {useListFormat} from '../hooks/useListFormat'
import {type CloseTagToken, simpleParser, type TextToken, type Token} from './simpleParser'

const COMPONENT_NAME_RE = /^[A-Z]/
const RECOGNIZED_HTML_TAGS = [
  'abbr',
  'address',
  'cite',
  'code',
  'del',
  'em',
  'ins',
  'kbd',
  'q',
  'samp',
  'strong',
  'sub',
  'sup',
]

type FormatterFns = {list: (value: Iterable<string>) => string}

/**
 * A map of component names to React components. The component names are the names used within the
 * locale resources, eg a key of `SearchTerm` should be rendered as `<SearchTerm/>` or
 * `<SearchTerm>{{term}}</SearchTerm>` (no whitespace in tag, nor attributes).
 *
 * The components receives `children`, but no other props.
 *
 * @public
 */
export type TranslateComponentMap = Record<
  string,
  ComponentType<{children?: ReactNode}> | keyof React.JSX.IntrinsicElements
>

/**
 * Props for the `Translate` component.
 *
 * @public
 */
export interface TranslationProps {
  /**
   * The `t` function to use, from the `useTranslation` hook
   */
  t: TFunction

  /**
   * The i18n resource key to translate
   */
  i18nKey: string

  /**
   * A map of component names to React components, used to render more complex content
   */
  components?: TranslateComponentMap

  /**
   * A string representing the "context" of the resource key.
   *
   * For an i18nKey of `greeter.greet-entity`, passing `context: 'human'` will look for a key of
   * `greeter.greet-entity_human` in the locale resources. If not found, it will fall back to the
   * base key (`greeter.greet-entity`).
   */
  context?: string

  /**
   * A map of values to interpolate into the translated string. The resources should use the
   * double curly bracket annotation to use them, eg `{{petName}}`. Will be escaped by React,
   * so no need to escape HTML.
   */
  values?: Record<string, string | string[] | number | undefined>
}

/**
 * Component for translating i18n resources.
 *
 * Note that this component is more expensive to render than using the `t` function from
 * `useTranslate` directly, so prefer that if possible. Generally, the only valid use case
 * for this component is when the translation needs to render a React component as part of
 * the message.
 *
 * @public
 */
export function Translate(props: TranslationProps) {
  /**
   * The i18next API is kinda weird - the second parameter to `t` is a mixture of options and
   * replacement values. All of the following properties are options for the `t` function, at
   * the time of writing:
   *
   * 'defaultValue', 'ordinal', 'context', 'replace', 'lng', 'lngs', 'fallbackLng', 'ns',
   * 'keySeparator', 'nsSeparator', 'returnObjects', 'returnDetails', 'joinArrays',
   * 'postProcess', 'interpolation'.
   *
   * Because we are explicitly receiving the interpolation values we want through `values`,
   * it is safer to explicitly pass these to the `replace` parameter, in order to avoid unexpected
   * behavior with built-in options.
   */
  const translated = props.t(props.i18nKey, {
    context: props.context,
    skipInterpolation: true,
    count:
      props.values && 'count' in props.values && typeof props.values.count === 'number'
        ? props.values.count
        : undefined,
  })

  const tokens = useMemo(() => simpleParser(translated), [translated])
  const listFormat = useListFormat()
  const formatters: FormatterFns = {
    list: (listValues) => listFormat.format(listValues),
  }
  return <>{render(tokens, props.values, props.components || {}, formatters)}</>
}

function render(
  tokens: Token[],
  values: TranslationProps['values'],
  componentMap: TranslateComponentMap,
  formatters: FormatterFns,
): ReactNode {
  const [head, ...tail] = tokens
  if (!head) {
    return null
  }
  if (head.type === 'interpolation') {
    const value = values ? values[head.variable] : undefined
    if (typeof value === 'undefined') {
      return `{{${head.variable}}}`
    }

    const formattedValue = applyFormatters(value, head.formatters || [], formatters)

    return (
      <>
        {formattedValue}
        {render(tail, values, componentMap, formatters)}
      </>
    )
  }
  if (head.type === 'text') {
    return (
      <>
        {head.text}
        {render(tail, values, componentMap, formatters)}
      </>
    )
  }
  if (head.type === 'tagOpen' && head.selfClosing) {
    const Component = componentMap[head.name]

    if (!Component) {
      throw new Error(`Component not found: ${head.name}`)
    }
    return (
      <>
        <Component />
        {render(tail, values, componentMap, formatters)}
      </>
    )
  }
  if (head.type === 'tagOpen' && !head.selfClosing) {
    const nextCloseIdx = tail.findIndex((token) => token.type === 'tagClose')
    const nextClose = tail[nextCloseIdx]
    if (nextClose) {
      if (head.name !== (nextClose as CloseTagToken).name) {
        throw new Error('Nested tags is not allowed')
      }
    }
    const Component = componentMap[head.name]
    if (!Component && COMPONENT_NAME_RE.test(head.name)) {
      throw new Error(`Component not defined: ${head.name}`)
    }

    if (!Component && !RECOGNIZED_HTML_TAGS.includes(head.name)) {
      throw new Error(`HTML tag "${head.name}" is not allowed`)
    }

    const children = tail.slice(0, nextCloseIdx) as TextToken[]
    const remaining = tail.slice(nextCloseIdx + 1)

    const As = Component ? Component : head.name
    return (
      <>
        <As>{render(children, values, componentMap, formatters)}</As>
        {render(remaining, values, componentMap, formatters)}
      </>
    )
  }
  return null
}

function applyFormatters(
  value: Required<TranslationProps>['values'][string],
  formatters: string[],
  formatterFns: FormatterFns,
): string {
  let formattedValue = value
  for (const formatter of formatters) {
    if (formatter === 'list') {
      if (Array.isArray(value)) {
        formattedValue = formatterFns.list(value)
      } else {
        throw new Error('List formatter used on non-array value')
      }
    }
  }
  return `${formattedValue}`
}
