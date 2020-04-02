import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {orderBy, groupBy} from 'lodash'
import {AbsoluteOverlayRenderer} from './AbsoluteOverlayRenderer'

const TRANSITION = {
  transitionProperty: 'all',
  transitionDuration: '1s'
}

const THRESHOLD_TOP = 30
const THRESHOLD_BOTTOM = 5

const RenderItem = ({childComponent: ChildComponent, ...props}) => <ChildComponent {...props} />

const bottom = rect => rect.top + rect.height

function group(entries) {
  // return orderBy(entries, entry => entry.item.rect.top)
  const grouped = {
    above: [],
    inside: [],
    below: [],
    ...groupBy(entries, entry => {
      const isNearBottom = entry.distanceBottom < -THRESHOLD_BOTTOM
      const isNearTop = entry.distanceTop < -THRESHOLD_TOP
      return isNearBottom ? 'below' : isNearTop ? 'above' : 'inside'
    })
  }

  return orderBy(
    [
      ...grouped.above.map((entry, i) => ({
        ...entry,
        indent: grouped.above.slice(i).reduce((w, entry) => w + entry.item.rect.width, 0)
      })),
      ...grouped.inside.map((entry, i) => ({...entry, indent: 0})),
      ...grouped.below.map((entry, i) => ({
        ...entry,
        indent: grouped.below.slice(0, i).reduce((w, entry) => w + entry.item.rect.width, 0)
      }))
    ],
    entry => entry.item.rect.top
  )
}

function StickyPresenceTransitionRenderer(props) {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        const grouped = group(entries)
        return grouped.map((entry, idx) => {
          const prevRect = grouped[idx - 1]?.item.rect
          const prevBottom = prevRect ? bottom(prevRect) : 0

          const spacerHeight = entry.item.rect.top - prevBottom

          const isNearBottom = entry.distanceBottom < -THRESHOLD_BOTTOM
          const isNearTop = entry.distanceTop < -THRESHOLD_TOP

          return (
            <>
              <div style={{height: Math.max(0, spacerHeight)}} />
              <div
                key={entry.item.id}
                style={{
                  transition: 'all',
                  transitionDuration: '200ms',
                  transitionTimingFunction: 'ease-in-out',
                  transform: `translate3d(-${entry.indent}px, 0px, 0px)`,
                  position: 'sticky',
                  pointerEvents: 'all',
                  height: entry.item.rect.height,
                  width: entry.item.rect.width,
                  marginLeft: isNearBottom || isNearTop ? `100%` : entry.item.rect.left,
                  top: 8,
                  bottom: 8
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

// export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
