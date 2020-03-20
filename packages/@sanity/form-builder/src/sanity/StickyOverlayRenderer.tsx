import * as React from 'react'
import {createIntersectionObserver} from './intersectionObserver'
import {tap, debounceTime} from 'rxjs/operators'
import {groupBy} from 'lodash'

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  // background: 'rgba(255, 255, 0, 0.25)'
}

const OVERLAY_ITEM_STYLE: React.CSSProperties = {
  // background: 'rgba(255, 0, 0, 0.25)',
  // transitionProperty: 'top, left',
  // transitionDuration: '0.4s',
  overflow: 'hidden',
  pointerEvents: 'all',
  // outline: '1px solid #f00',
  position: 'absolute'
}

const WithIntersection = props => {
  const {onIntersection, io, id, ...rest} = props
  const element = React.useRef()
  React.useEffect(() => {
    const io = createIntersectionObserver({threshold: [0, 0.1, 0.9, 1]})
    const sub = io
      .observe(element.current)
      .pipe(tap(entry => onIntersection(id, entry)))
      .subscribe()
    return () => sub.unsubscribe()
  }, [io])

  return <div ref={element} {...rest} />
}

export function StickyOverlayRenderer(props) {
  const {items, children, trackerRef} = props

  const io = React.useMemo(() => createIntersectionObserver({threshold: [0, 0.1, 0.5, 0.9, 1]}), [])

  const [intersections, setIntersections] = React.useState({})

  const onIntersection = React.useCallback((id, entry) => {
    setIntersections(current => ({...current, [id]: entry}))
  }, [])

  const top = intersections['::top']
  const bottom = intersections['::bottom']
  const positions =
    top && bottom
      ? items
          .map(item => {
            const intersection = intersections[item.id]
            if (!intersection) {
              return null
            }

            const distanceTop = intersection.boundingClientRect.top - top.boundingClientRect.bottom

            const distanceBottom =
              bottom.boundingClientRect.bottom - intersection.boundingClientRect.bottom

            console.log({distanceTop, distanceBottom})
            const above = distanceTop < -20
            const below = distanceBottom < -20

            // const inside = intersection.isIntersecting && !above && !below

            return {position: above ? 'above' : below ? 'below' : 'inside', item}
          })
          .filter(Boolean)
      : []

  const groups = {inside: [], below: [], above: [], ...groupBy(positions, e => e.position)}

  return (
    <div style={{position: 'relative'}}>
      <WithIntersection
        io={io}
        id="::top"
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          top: 0,
          height: 1,
          // backgroundColor: 'red'
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          justifyContent: 'flex-end'
        }}
      >
        {groups.above.map(e => (
          <div
            key={e.item.id}
            style={{
              position: 'absolute',
              overflow: 'hidden',
              display: 'inline-block',
              left: e.item.rect.left
            }}
          >
            {e.item.children}
          </div>
        ))}
      </div>
      <div ref={trackerRef} style={{position: 'relative'}}>
        {children}
      </div>
      <div style={OVERLAY_STYLE}>
        {items.map(item => {
          return (
            <WithIntersection
              io={io}
              onIntersection={onIntersection}
              key={item.id}
              id={item.id}
              style={{
                ...OVERLAY_ITEM_STYLE,
                ...item.rect,
                visibility: 'hidden'
              }}
            />
          )
        })}
      </div>
      <div
        style={{
          display: 'flex',
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          justifyContent: 'flex-end'
        }}
      >
        {groups.below.map(e => (
          <div
            key={e.item.id}
            style={{
              position: 'absolute',
              top: -e.item.rect.height,
              left: e.item.rect.left,
              overflow: 'hidden',
              display: 'inline-block'
            }}
          >
            {e.item.children}
          </div>
        ))}
      </div>
      <WithIntersection
        id="::bottom"
        io={io}
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          bottom: 0,
          height: 1,
          // backgroundColor: 'blue'
        }}
      />
    </div>
  )
}
