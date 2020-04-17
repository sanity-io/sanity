/* eslint-disable react/no-multi-comp */
import * as React from 'react'
import {createIntersectionObserver} from './intersectionObserver'
import {tap} from 'rxjs/operators'
import {THRESHOLD_BOTTOM, THRESHOLD_TOP, DEBUG} from './constants'

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
  background: DEBUG ? 'rgba(255, 255, 0, 0.25)' : '',
  zIndex: 5
}

const OVERLAY_ITEM_STYLE: React.CSSProperties = {
  background: DEBUG ? 'rgba(255, 0, 0, 0.25)' : '',
  overflow: 'hidden',
  pointerEvents: 'none',
  outline: '1px solid #00b',
  position: 'absolute'
}

// TODO: type this
const WithIntersection = props => {
  const {onIntersection, io, id, ...rest} = props
  const element = React.useRef()
  React.useEffect(() => {
    const sub = io
      .observe(element.current)
      .pipe(tap(entry => onIntersection(id, entry)))
      .subscribe()
    return () => sub.unsubscribe()
  }, [io])

  return <div ref={element} {...rest} />
}

type Props = {
  regions: any[]
  render: (regionsWithIntersectionDetails: any[]) => React.ReactElement
  children: React.ReactElement
  trackerRef: React.RefObject<any>
}

export function RegionIntersectionAssembler(props: Props) {
  const {regions, render, children, trackerRef} = props

  const io = React.useMemo(
    () => createIntersectionObserver({threshold: [0, 0.01, 0.1, 0.2, 0.5, 0.8, 0.9, 0.99, 1]}),
    []
  )

  const [intersections, setIntersections] = React.useState({})

  const onIntersection = React.useCallback((id, entry) => {
    setIntersections(current => ({...current, [id]: entry}))
  }, [])

  const top = intersections['::top']
  const bottom = intersections['::bottom']
  const regionsWithIntersectionDetails =
    top && bottom
      ? regions
          .map(region => {
            const intersection = intersections[region.id]
            if (!intersection) {
              return null
            }

            const distanceTop = intersection.boundingClientRect.top - top.boundingClientRect.bottom

            const distanceBottom =
              bottom.boundingClientRect.bottom - intersection.boundingClientRect.bottom

            const position =
              distanceTop < -THRESHOLD_TOP
                ? 'top'
                : distanceBottom < -THRESHOLD_BOTTOM
                ? 'bottom'
                : 'inside'
            return {
              distanceTop,
              distanceBottom,
              region,
              position
            }
          })
          .filter(Boolean)
      : []

  return (
    <div ref={trackerRef} style={{position: 'relative'}}>
      <WithIntersection
        io={io}
        id="::top"
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          top: 0,
          height: 1,
          backgroundColor: DEBUG ? 'red' : 'none'
        }}
      />
      <div>{children}</div>
      <div style={OVERLAY_STYLE}>{render(regionsWithIntersectionDetails)}</div>
      <div style={OVERLAY_STYLE}>
        {regions.map(region => {
          const forceWidth = region.rect.width === 0
          return (
            <WithIntersection
              io={io}
              onIntersection={onIntersection}
              key={region.id}
              id={region.id}
              style={{
                ...OVERLAY_ITEM_STYLE,
                width: forceWidth ? 1 : region.rect.width,
                left: region.rect.left - (forceWidth ? 1 : 0),
                top: region.rect.top - 30,
                height: region.rect.height + 60,
                visibility: DEBUG ? 'visible' : 'hidden'
              }}
            />
          )
        })}
      </div>
      <div style={{padding: 20}} />
      <WithIntersection
        id="::bottom"
        io={io}
        onIntersection={onIntersection}
        style={{
          position: 'sticky',
          bottom: 0,
          height: 1,
          backgroundColor: DEBUG ? 'blue' : 'none'
        }}
      />
    </div>
  )
}
