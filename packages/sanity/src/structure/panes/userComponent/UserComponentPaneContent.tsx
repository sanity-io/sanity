import {Box} from '@sanity/ui'
import {type ReactNode} from 'react'

import {usePane} from '../../components'
import * as styles from '../../Structure.css'

interface UserComponentPaneContentProps {
  children: ReactNode
}

export function UserComponentPaneContent(props: UserComponentPaneContentProps) {
  const {children} = props
  const {collapsed} = usePane()

  return (
    <Box
      className={styles.userComponentPaneRootStyle}
      hidden={collapsed}
      height="fill"
      overflow="auto"
    >
      {children}
    </Box>
  )
}
