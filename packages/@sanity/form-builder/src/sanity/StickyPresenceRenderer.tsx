import * as React from 'react'

const bottom = rect => rect.top + rect.height

const ITEM_STYLE: React.CSSProperties = {
  transitionProperty: 'all',
  transitionDuration: '1s',
  background: 'rgba(255, 0, 0, 0.25)',
  overflow: 'hidden',
  pointerEvents: 'all',
  outline: '1px solid #f00',
  position: 'sticky',
  bottom: 5,
  top: 5
}
const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  backgroundColor: 'rgba(0, 255, 0, 0.4)'
}

export const StickyPresenceTransitionRenderer = React.memo(props => {
  const {items} = props
  return (
    <div style={OVERLAY_STYLE}>
      {items.map((item, idx) => {
        const prevItem = items[idx - 1]
        const prevBottom = prevItem ? bottom(prevItem.rect) : 0
        return (
          <div
            key={item.id}
            style={{
              ...ITEM_STYLE,
              marginLeft: item.rect.left,
              marginTop: item.rect.top - prevBottom,
              width: item.rect.width,
              height: item.rect.height
            }}
          >
            {item.id}
          </div>
        )
      })}
    </div>
  )
})
