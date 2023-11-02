import React, {useCallback} from 'react'
import {Box, Button, Flex} from '@sanity/ui'
import {DragHandleIcon} from '@sanity/icons'
import styled from 'styled-components'
import {BlockProps} from 'sanity'

export const BlockHandle = styled(Box)`
  max-width: 140px;
  min-width: 140px;
`

export default function ScratchPadBlock(props: BlockProps) {
  const handleBlockHandleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    //
  }, [])
  return (
    <Flex>
      <BlockHandle contentEditable={false} style={{userSelect: 'none'}}>
        <Button size={1} mode="ghost" icon={DragHandleIcon} onClick={handleBlockHandleClick} />
      </BlockHandle>
      <Box flex={1}>{props.renderDefault(props)}</Box>
    </Flex>
  )
}
