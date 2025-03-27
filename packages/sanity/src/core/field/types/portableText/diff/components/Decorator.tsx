import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

const DecoratorWrapper = styled.span<{decoration: string}>`
  display: inline;
  ${({theme, decoration}) => {
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
          font-family: ${vars.font.code.family};
          background: ${vars.color.tinted.default.bg[0]};
        `
      default:
        return ''
    }
  }}
`

export function Decorator({mark, children}: {mark: string; children: React.JSX.Element}) {
  return <DecoratorWrapper decoration={mark}>{children}</DecoratorWrapper>
}
