import * as React from 'react'

const ITEM_STYLE: React.CSSProperties = {
  transitionProperty: 'all',
  transitionDuration: '1s',
  overflow: 'hidden',
  pointerEvents: 'all',
  outline: '1px solid #f00',
  position: 'absolute'
}
export const AbsolutePresenceTransitionRenderer = React.memo(props => {
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
})
