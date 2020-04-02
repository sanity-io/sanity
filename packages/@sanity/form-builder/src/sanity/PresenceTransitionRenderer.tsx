import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {orderBy} from 'lodash'
import {AbsoluteOverlayRenderer} from './AbsoluteOverlayRenderer'

const TRANSITION = {
  transitionProperty: 'all',
  transitionDuration: '1s'
}

const THRESHOLD_TOP = 30
const THRESHOLD_BOTTOM = 5

const RenderItem = ({childComponent: ChildComponent, ...props}) => <ChildComponent {...props} />

const bottom = rect => rect.top + rect.height

function StickyPresenceTransitionRenderer(props) {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        const ordered = orderBy(entries, entry => entry.item.rect.top)
        return ordered.map((entry, idx) => {
          const prevRect = ordered[idx - 1]?.item.rect
          const prevBottom = prevRect ? bottom(prevRect) : 0

          const spacerHeight = entry.item.rect.top - prevBottom

          const isNearBottom = entry.distanceBottom < -THRESHOLD_BOTTOM
          const isNearTop = entry.distanceTop < -THRESHOLD_TOP

          return (
            <>
              {spacerHeight > 0 && <div style={{height: spacerHeight}} />}
              <div
                key={entry.item.id}
                style={{
                  ...TRANSITION,
                  position: 'sticky',
                  display: 'inline-block',
                  top: 8,
                  bottom: 8,
                  left: entry.item.rect.left
                }}
              >
                <RenderItem
                  {...entry.item.props}
                  position={isNearTop ? 'top' : isNearBottom ? 'bottom' : null}
                />
              </div>
            </>
          )
        })
      }}
    />
  )
}

export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
// export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
