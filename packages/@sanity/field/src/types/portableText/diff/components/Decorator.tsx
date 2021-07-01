import {Theme} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'

const DecoratorWrapper = styled.span`
  display: inline;
  ${({theme, decoration}: {theme: Theme; decoration: string}) => {
    switch (decoration) {
      case 'strong':
        return 'font-weight: bold;'
      case 'em':
        return 'font-style: italic;'
      case 'underline':
        return 'text-decoration: underline;'
      case 'overline':
        return 'text-decoration: overline;'
      case 'strike-through':
        return 'text-decoration: line-through;'
      case 'code':
        return `
          font-family: ${theme.sanity.fonts.code.family};
          background: ${theme.sanity.color.muted.default.enabled.bg};
        `
      default:
        return ''
    }
  }}
`

export default function Decorator({mark, children}: {mark: string; children: JSX.Element}) {
  return <DecoratorWrapper decoration={mark}>{children}</DecoratorWrapper>
}
