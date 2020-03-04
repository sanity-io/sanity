import React from 'react'
import {Context} from './PositionTracker'
import {tap} from 'rxjs/operators'

export function PositionsOverlay(props) {
  const ref = null
  const ctx = React.useContext(Context)
  const [positions, setPositions] = React.useState([])
  React.useEffect(() => {
    const subscription = ctx.__positions$
      .pipe(tap(positions => setPositions(positions)))
      .subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10000
      }}
    >
      {positions.map((pos, idx) => {
        console.log('prev bottom', positions[idx - 1]?.rect.bottom)
        return (
          <div
            title={pos.key}
            key={pos.key}
            style={{
              outline: '1px solid red',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              position: 'fixed',
              ...pos.rect
              // pointerEvents: 'all',
              // marginLeft: pos.rect.left,
              // marginTop: pos.rect.top - positions[idx - 1]?.rect.bottom || 0,
              // top: 0
            }}
          >
            Overlay ({pos.key})
          </div>
        )
      })}
    </div>
  )
}
