import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'

const TRANSITION = {
  transitionProperty: 'all',
  transitionDuration: '1s'
}

const THRESHOLD_TOP = 30
const THRESHOLD_BOTTOM = 5

const RenderItem = ({childComponent: ChildComponent, ...props}) => <ChildComponent {...props} />

const bottom = rect => rect.top + rect.height

export const PresenceTransitionRenderer = props => {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        return entries.map((entry, idx) => {
          const prevRect = entry[idx - 1]?.item.rect
          const prevBottom = prevRect ? bottom(prevRect) : 0

          const isNearBottom = entry.distanceBottom < -THRESHOLD_BOTTOM

          const isNearTop = entry.distanceTop < -THRESHOLD_TOP
          const marginTop = isNearTop
            ? Math.max(0, entry.distanceTop + THRESHOLD_TOP)
            : entry.item.rect.top - prevBottom

          const div = (
            <>
              <div style={{height: marginTop}} />
              <div
                key={entry.item.id}
                style={{
                  ...TRANSITION,
                  position: 'sticky',
                  ...(isNearTop ? {top: '8px'} : isNearBottom ? {bottom: '8px'} : {}),
                  marginLeft: entry.item.rect.left
                }}
              >
                <RenderItem
                  {...entry.item.props}
                  position={isNearTop ? 'top' : isNearBottom ? 'bottom' : null}
                />
              </div>
            </>
          )
          return div
        })
      }}
    />
  )
}
