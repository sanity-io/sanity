import {type ReactNode} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {usePane} from '../../components/pane/usePane'

interface UserComponentPaneContentProps {
  children: ReactNode
}

const Root = styled(Box)`
  position: relative;
`

export function UserComponentPaneContent(props: UserComponentPaneContentProps) {
  const {children} = props
  const {collapsed} = usePane()

  return (
    <Root hidden={collapsed} height="100%" overflow="auto">
      {children}
    </Root>
  )
}
