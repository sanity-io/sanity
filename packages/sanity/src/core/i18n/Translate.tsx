import React, {type ComponentType, type ReactNode, useMemo} from 'react'
import type {TFunction} from 'i18next'
import {CloseTagToken, simpleParser, TextToken, Token} from './simpleParser'

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

/**
 * @beta
 */
export type TranslateComponentMap = Record<
  string,
  ComponentType<{children?: ReactNode}> | keyof JSX.IntrinsicElements
>

/**
 * @beta
 */
export interface TranslationProps {
  t: TFunction
  i18nKey: string

  components?: TranslateComponentMap
  context?: string
  values?: Record<string, string | string[] | number | undefined>
}

function render(tokens: Token[], componentMap: TranslateComponentMap): ReactNode {
  const [head, ...tail] = tokens
  if (!head) {
    return null
  }
  if (head.type === 'text') {
    return (
      <>
        {head.text}
        {render(tail, componentMap)}
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
        {render(tail, componentMap)}
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

    return Component ? (
      <>
        <Component>{render(children, componentMap)}</Component>
        {render(remaining, componentMap)}
      </>
    ) : (
      <>
        {React.createElement(head.name, {}, render(children, componentMap))}
        {render(remaining, componentMap)}
      </>
    )
  }
  return null
}

/**
 * @beta
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
    replace: props.values,
    count:
      props.values && 'count' in props.values && typeof props.values.count === 'number'
        ? props.values.count
        : undefined,
  })

  const tokens = useMemo(() => simpleParser(translated), [translated])

  return <>{render(tokens, props.components || {})}</>
}
