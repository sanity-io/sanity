import React from 'react'
import {sortBy} from 'lodash'

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
}

const ITEM_STYLE = {
  display: 'inline-block',
  transitionProperty: 'all',
  transitionDuration: '2000ms',
  transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
  background: 'rgba(255, 0, 0, 0.25)',
  overflow: 'hidden',
  textAlign: 'right',
  pointerEvents: 'all',
  position: 'absolute',
  outline: '1px solid #f00',
}

// This renders regions as they are reported from the RegionReporter. Useful for debugging
export function AbsoluteOverlay(props: any) {
  const {regions, trackerRef, children, ...rest} = props
  return (
    <div ref={trackerRef} style={{position: 'relative'}}>
      <div>{children}</div>
      <div style={OVERLAY_STYLE}>
        {sortBy(
          regions.filter((r: any) => r.data.presence?.length > 0),
          (region) => -region.rect.top
        ).map((region) => {
          return (
            <div
              key={region.id}
              style={{
                ...ITEM_STYLE,
                ...region.rect,
              }}
            >
              {region.id}
            </div>
          )
        })}
      </div>
    </div>
  )
}
