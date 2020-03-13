import * as React from 'react'
import styled from 'styled-components'

const Item = styled.div`
  display: inline-block;
  transition-property: all;
  transition-duration: 1s;
  background: rgba(255, 0, 0, 0.25);
  overflow: hidden;
  text-align: right;
  pointer-events: all;
  position: absolute;
  outline: 1px solid #f00;
`

export function AbsoluteOverlayRenderer(props) {
  const {items} = props
  return items.map(item => {
    return (
      <Item
        key={item.id}
        style={{
          ...item.rect
        }}
      >
        {item.id}
      </Item>
    )
  })
}
