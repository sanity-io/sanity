import {Box, Card, Flex, Text, TextInput} from '@sanity/ui'
import React from 'react'
import styled from 'styled-components'
import {CommandListContainer} from '../CommandListContainer'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider} from '../CommandListProvider'
import {useCommandList} from '../useCommandList'

const ITEMS = [...Array(10000).keys()]

const CardContainer = styled(Card)`
  height: 400px;
  max-width: 400px;
  width: 100%;
`

const StyledBox = styled(Box)<{$index: number}>`
  background: ${({$index}) => ($index % 2 === 0 ? '#1a1a1a' : '#1f1f1f')};
`

const VirtualListItem = ({index}: {index: number}) => (
  <StyledBox
    $index={index} //
    data-command-list-item
    padding={2}
  >
    <Text>{index}</Text>
  </StyledBox>
)

export default function CommandListStory() {
  return (
    <CardContainer padding={4}>
      <CommandListProvider
        ariaActiveDescendant={ITEMS.length > 0}
        ariaChildrenLabel="Children"
        ariaHeaderLabel="Header"
        autoFocus
        itemIndices={ITEMS}
      >
        <CommandListContent />
      </CommandListProvider>
    </CardContainer>
  )
}

const CommandListContent = () => {
  const {setHeaderInputElement} = useCommandList()

  return (
    <Flex direction="column" style={{height: '400px'}}>
      <Box style={{flexShrink: 0}}>
        <TextInput placeholder="Header text input" ref={setHeaderInputElement} />
      </Box>

      <CommandListContainer>
        <CommandListItems
          fixedHeight
          item={VirtualListItem}
          virtualizerOptions={{
            estimateSize: () => 25,
          }}
        />
      </CommandListContainer>
    </Flex>
  )
}
