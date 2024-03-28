import {Box, Text} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

const NormalText = styled(Text)`
  word-break: break-word;
`

interface NormalBlockProps {
  children: ReactNode
}

export function DescriptionInputBlock(props: NormalBlockProps) {
  const {children} = props

  return (
    <Box paddingTop={2} paddingBottom={3}>
      <NormalText size={1}>{children}</NormalText>
    </Box>
  )
}
