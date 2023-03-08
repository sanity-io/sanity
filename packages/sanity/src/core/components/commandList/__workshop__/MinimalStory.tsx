import React, {useMemo} from 'react'
import styled from 'styled-components'
import {CommandListItems} from '../CommandListItems'
import {CommandListProvider, type CommandListVirtualItemProps} from '../CommandListProvider'

const ITEMS = [...Array(50000).keys()]

const StyledLink = styled.a`
  background: #1a1a1a;
  font-family: sans-serif;
  display: block;
  padding: 5px;
  &[data-active] {
    background: #333;
  }
`

export default function MinimalStory() {
  const values = ITEMS.map((i) => ({value: i}))

  const VirtualListItem = useMemo(() => {
    return function VirtualListItemComponent({value}: CommandListVirtualItemProps<number>) {
      return <StyledLink>{value}</StyledLink>
    }
  }, [])

  return (
    <div
      style={{
        height: '400px',
        maxWidth: '400px',
        padding: '25px',
        width: '100%',
      }}
    >
      <CommandListProvider
        activeItemDataAttr="data-active"
        fixedHeight
        itemComponent={VirtualListItem}
        values={values}
        virtualizerOptions={{
          estimateSize: () => 28,
        }}
      >
        <div style={{height: '400px'}}>
          <CommandListItems />
        </div>
      </CommandListProvider>
    </div>
  )
}
