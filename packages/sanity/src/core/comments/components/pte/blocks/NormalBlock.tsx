import {Text} from '@sanity/ui-v3'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

const NormalText = styled(Text)`
  word-break: break-word;
`

interface NormalBlockProps {
  children: ReactNode
}

export function NormalBlock(props: NormalBlockProps): React.JSX.Element {
  const {children} = props

  return <NormalText size={1}>{children}</NormalText>
}
