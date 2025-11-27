import {Box} from '@sanity/ui'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

import {usePane} from '../../components'

interface UserComponentPaneContentProps {
  children: ReactNode
}

const Root = styled(Box)`
  position: relative;
`

export function UserComponentPaneContent(props: UserComponentPaneContentProps) : React.JSX.Element {
  const {children} = props
  const {collapsed} = usePane()

  return (
    <Root hidden={collapsed} height="fill" overflow="auto">
      {children}
    </Root>
  )
}
