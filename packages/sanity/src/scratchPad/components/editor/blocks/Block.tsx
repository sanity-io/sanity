import React, {ReactNode, useCallback} from 'react'
import {Box, Flex, Text} from '@sanity/ui'
import {DragHandleIcon} from '@sanity/icons'
import styled from 'styled-components'
import {BlockProps} from 'sanity'

export const BlockHandle = styled(Box)`
  max-width: 140px;
  min-width: 140px;
`

const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
  e.preventDefault()
  e.stopPropagation()
}

const DraggableBlock = ({children}: {children: ReactNode}) => {
  return (
    <Flex>
      <Box contentEditable={false} style={{userSelect: 'none'}} marginRight={4} paddingTop={1}>
        <Text size={1}>
          <DragHandleIcon />
        </Text>
      </Box>
      <Box flex={1} onDragStart={preventDefault} draggable>
        {children}
      </Box>
    </Flex>
  )
}

export default function ScratchPadBlock(props: BlockProps) {
  return <DraggableBlock>{props.renderDefault(props)}</DraggableBlock>
}
