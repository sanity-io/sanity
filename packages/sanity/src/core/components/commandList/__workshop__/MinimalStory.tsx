import React, {useCallback, useRef} from 'react'
import styled from 'styled-components'
import {CommandList} from '../CommandList'
import {CommandListHandle, CommandListRenderItemCallback} from '../types'

const ITEMS = [...Array(5000).keys()].map((i) => `Item ${i}`)

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
  const commandListRef = useRef<CommandListHandle | null>(null)

  const handleScrollToTop = useCallback(() => {
    commandListRef?.current?.scrollToIndex(0)
  }, [])

  const renderItem = useCallback<CommandListRenderItemCallback<string>>((item) => {
    return <StyledLink>{item}</StyledLink>
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
          items={ITEMS}
          overscan={20}
          ref={commandListRef}
          renderItem={renderItem}
        />
      </div>

      <button type="button" onClick={handleScrollToTop}>
        Scroll to top
      </button>
    </div>
  )
}
