import React, {ComponentType, ReactNode, useMemo} from 'react'
import type {TFunction} from 'i18next'
import {CloseTagToken, simpleParser, TextToken, Token} from './simpleParser'

type ComponentMap = Record<string, ComponentType<{children?: ReactNode}>>

/**
 * @beta
 */
export interface TranslationProps {
  t: TFunction
  i18nKey: string
  components: ComponentMap
  values: Record<string, string>
}

function render(tokens: Token[], componentMap: ComponentMap): ReactNode {
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
    if (!Component) {
      throw new Error(`Component not found: ${head.name}`)
    }
    const children = tail.slice(0, nextCloseIdx) as TextToken[]
    const remaining = tail.slice(nextCloseIdx + 1)
    return (
      <>
        <Component>{render(children, componentMap)}</Component>
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
  const translated = props.t(props.i18nKey, props.values)

  const tokens = useMemo(() => simpleParser(translated), [translated])

  return <>{render(tokens, props.components)}</>
}
