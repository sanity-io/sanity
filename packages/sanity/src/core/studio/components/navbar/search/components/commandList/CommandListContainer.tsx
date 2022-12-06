import {Flex} from '@sanity/ui'
import React, {ReactNode} from 'react'
import {useCommandList} from './useCommandList'

interface CommandListContainerProps {
  children: ReactNode
}

export function CommandListContainer({children}: CommandListContainerProps) {
  const {setContainerElement} = useCommandList()

  return <Flex ref={setContainerElement}>{children}</Flex>
}
