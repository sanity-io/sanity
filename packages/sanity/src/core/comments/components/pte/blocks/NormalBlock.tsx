import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Text} from 'ui5'

const NormalText = styled(Text)`
  word-break: break-word;
`

interface NormalBlockProps {
  children: ReactNode
}

export function NormalBlock(props: NormalBlockProps): React.JSX.Element {
  const {children} = props

  return (
    <NormalText size={1} forwardedAs="div" trim={true}>
      {children}
    </NormalText>
  )
}
