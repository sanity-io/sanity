import * as React from 'react'

const ITEM_STYLE = {
  display: 'inline-block',
  transitionProperty: 'all',
  transitionDuration: '1s',
  background: 'rgba(255, 0, 0, 0.25)',
  overflow: 'hidden',
  textAlign: 'right',
  pointerEvents: 'all',
  position: 'absolute',
  outline: '1px solid #f00'
}

export function AbsoluteOverlayRenderer(props) {
  const {items} = props
  return items.map(item => {
    return (
      <div
        key={item.id}
        style={{
          ...ITEM_STYLE,
          ...item.rect
        }}
      >
        {item.id}
      </div>
    )
  })
}
