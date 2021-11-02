import {Box} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {usePane} from '../../components'

interface UserComponentPaneContentProps {
  children: React.ReactNode
}

const Root = styled(Box)`
  position: relative;
`

export function UserComponentPaneContent(props: UserComponentPaneContentProps) {
  const {children} = props
  const {collapsed} = usePane()

  return (
    <Root hidden={collapsed} height="fill" overflow="auto">
      {children}
    </Root>
  )
}
