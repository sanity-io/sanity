import React, {useCallback, useRef, useState} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListVirtualItemProps} from '../types'

const ITEMS = [...Array(5000).keys()]

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
  const values = ITEMS.map((i) => ({value: `Item ${i}`}))

  const commandListRef = useRef<CommandListHandle | null>(null)

  const handleScrollToTop = useCallback(() => {
    commandListRef?.current?.scrollToIndex(0)
  }, [])

  const renderItem = useCallback((item: CommandListVirtualItemProps<number>) => {
    return <StyledLink>{item.value}</StyledLink>
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
      <div style={{height: '400px', position: 'relative'}}>
        <CommandList
          ariaLabel="Children"
          fixedHeight
          itemHeight={28}
          overscan={20}
          ref={commandListRef}
          renderItem={renderItem}
          values={values}
        />
      </div>

      <button type="button" onClick={handleScrollToTop}>
        Scroll to top
      </button>
    </div>
  )
}
