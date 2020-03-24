import * as React from 'react'
import {sortBy} from 'lodash'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
const STYLE = {
  transitionProperty: 'all',
  transitionDuration: '1s'
}
const RenderItem = ({childComponent: ChildComponent, ...props}) => <ChildComponent {...props} />

export const GroupedTransitionRenderer = props => {
  return (
    <StickyOverlayRenderer
      {...props}
      render={{
        above: entries => {
          let prevRight = 0
          return (
            <div
              style={{
                position: 'sticky',
                width: '100%',
                top: 0,
                zIndex: 1
              }}
            >
              {sortBy(entries, e => 1 - e.item.rect.top).map((entry, i) => {
                const res = (
                  <div
                    key={entry.item.id}
                    style={{
                      ...STYLE,
                      position: 'absolute',
                      right: prevRight,
                      top: Math.max(7, 60 - Math.max(0, -entry.distanceTop + 10))
                    }}
                  >
                    <RenderItem
                      {...entry.item.props}
                      position={entry.distanceTop < -40 ? 'top' : 'inside'}
                    />
                  </div>
                )
                prevRight += entry.item.rect.width || 0
                return res
              })}
            </div>
          )
        },
        inside: entries =>
          entries.map(entry => {
            return (
              <div
                key={entry.item.id}
                style={{
                  ...STYLE,
                  position: 'absolute',
                  ...entry.item.rect
                }}
              >
                <RenderItem {...entry.item.props} />
              </div>
            )
          }),
        below: entries => {
          let prevRight = 0
          return (
            <div
              style={{
                ...STYLE,
                position: 'sticky',
                width: '100%',
                bottom: 0
              }}
            >
              {sortBy(entries, e => e.item.rect.top).map((entry, i) => {
                const res = (
                  <div
                    key={entry.item.id}
                    style={{
                      ...STYLE,
                      position: 'absolute',
                      right: prevRight,
                      bottom: Math.max(7, 30 - -entry.distanceBottom)
                    }}
                  >
                    <RenderItem
                      {...entry.item.props}
                      position={entry.distanceBottom < -10 ? 'bottom' : 'inside'}
                    />
                  </div>
                )
                prevRight += entry.item.rect.width || 0
                return res
              })}
            </div>
          )
        }
      }}
    />
  )
}
