import React from 'react'
import {Context} from './context'
import {tap} from 'rxjs/operators'

const Noop = () => null

export const Overlay = React.memo(function PositionsOverlay(props: any) {
  const ctx = React.useContext(Context)
  const [positions, setPositions] = React.useState<any>([])
  React.useEffect(() => {
    const subscription = ctx.__positions$
      .pipe(tap(positions => setPositions(positions)))
      .subscribe()
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const {renderWith: Component = Noop, ...rest} = props
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none'
      }}
    >
      <Component items={positions} />
    </div>
  )
})
