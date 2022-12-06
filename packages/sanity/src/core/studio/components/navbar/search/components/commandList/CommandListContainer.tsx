import {Flex} from '@sanity/ui'
import React, {ReactNode} from 'react'
import styled from 'styled-components'
import {useCommandList} from './useCommandList'

interface CommandListContainerProps {
  children: ReactNode
}

const ContainerFlex = styled(Flex)`
  &[data-focused='true'],
  &[data-hovered='true'] {
    [data-active='true'] {
      [data-command-list-item]:not(:active) {
        background: ${({theme}) => theme.sanity.color.button.bleed.default.hovered.bg};
        // Disable box-shadow to hide the halo effect when we have keyboard focus over a selected <Button>
        box-shadow: none;
      }
    }
  }
`

export function CommandListContainer({children}: CommandListContainerProps) {
  const {setContainerElement} = useCommandList()

  return <ContainerFlex ref={setContainerElement}>{children}</ContainerFlex>
}
