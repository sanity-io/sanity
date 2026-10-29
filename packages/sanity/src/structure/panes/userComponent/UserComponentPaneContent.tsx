import {type ReactNode} from 'react'
import {Box} from 'ui5'

import {usePane} from '../../components/pane/usePane'
import {root} from './UserComponentPaneContent.css'

interface UserComponentPaneContentProps {
  children: ReactNode
}

export function UserComponentPaneContent(props: UserComponentPaneContentProps) {
  const {children} = props
  const {collapsed} = usePane()

  return (
    <Box className={root} hidden={collapsed} height="100%" overflow="auto">
      {children}
    </Box>
  )
}
