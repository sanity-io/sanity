import {
  type ForwardedRef,
  forwardRef,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {resizeObserver} from '../../util/resizeObserver'
import {
  DEBUG,
  INTERSECTION_ELEMENT_PADDING,
  INTERSECTION_THRESHOLDS,
  SNAP_TO_DOCK_DISTANCE_BOTTOM,
  SNAP_TO_DOCK_DISTANCE_TOP,
} from '../constants'
import {
  type FieldPresenceData,
  type RegionWithIntersectionDetails,
  type ReportedRegionWithRect,
} from '../types'
import {createIntersectionObserver} from './intersectionObserver'
import {
  BottomRegionWrapper,
  MiddleRegionWrapper,
  OverlayWrapper,
  RootWrapper,
  TopRegionWrapper,
} from './RegionsWithIntersections.styled'

interface RegionsWithIntersectionsProps {
  regions: ReportedRegionWithRect<FieldPresenceData>[]
  render: (
    regionsWithIntersectionDetails: RegionWithIntersectionDetails[],
    containerWidth: number,
  ) => ReactNode | null
  children: ReactNode
  margins: [number, number, number, number]
}

const toPx = (num: number) => `${num}px`
const negate = (num: number) => 0 - num

export const RegionsWithIntersections = forwardRef(function RegionsWithIntersections(
  props: RegionsWithIntersectionsProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {
    regions,
    render,
    children,
    margins: [mt, mr, mb, ml],
  } = props

  const overlayRef = useRef<HTMLDivElement | null>(null)

  // Make sure `margins` is memoized
  const margins = useMemo<[number, number, number, number]>(
    () => [mt, mr, mb, ml],
    [mt, mr, mb, ml],
  )

  const io = useMemo(
    () =>
      createIntersectionObserver({
        rootMargin: margins.map(negate).map(toPx).join(' '),
        threshold: INTERSECTION_THRESHOLDS,
      }),
    [margins],
  )

  const [intersections, setIntersections] = useState<
    Record<
      string,
      | {
          boundingClientRect: {top: number; bottom: number}
          isIntersecting: boolean
          intersectionRect: {top: number; bottom: number}
        }
      | undefined
    >
  >({})

  const onIntersection = useCallback((id: any, entry: any) => {
    setIntersections((current) => ({...current, [id]: entry}))
  }, [])

  const [overlayWidth, setOverlayWidth] = useState(0)
  useLayoutEffect(() => {
    if (!overlayRef.current) return undefined

    setOverlayWidth(overlayRef.current.offsetWidth)

    return resizeObserver.observe(overlayRef.current, (event) => {
      setOverlayWidth(event.contentRect.width)
    })
  }, [])

  const top = intersections['::top']
  const bottom = intersections['::bottom']
  const regionsWithIntersectionDetails: RegionWithIntersectionDetails[] = useMemo(
    () =>
      (top && bottom
        ? regions
            .filter((region) => region.presence?.length > 0)
            .map((region): RegionWithIntersectionDetails | null => {
              const intersection = intersections[region.id]

              if (!intersection) {
                return null
              }

              const {bottom: boundsBottom, top: boundsTop} = intersection.boundingClientRect

              const aboveTop = intersection.boundingClientRect.top < top.boundingClientRect.bottom
              const belowBottom =
                intersection.boundingClientRect.top < bottom.boundingClientRect.top

              const distanceTop = intersection.isIntersecting
                ? boundsTop - (intersection.intersectionRect.top - INTERSECTION_ELEMENT_PADDING)
                : aboveTop
                  ? -top.boundingClientRect.bottom
                  : bottom.boundingClientRect.top

              const distanceBottom = intersection.isIntersecting
                ? -(
                    boundsBottom -
                    (intersection.intersectionRect.bottom + INTERSECTION_ELEMENT_PADDING)
                  )
                : belowBottom
                  ? bottom.boundingClientRect.top
                  : -top.boundingClientRect.bottom

              const position =
                distanceTop <= SNAP_TO_DOCK_DISTANCE_TOP
                  ? 'top'
                  : distanceBottom <= SNAP_TO_DOCK_DISTANCE_BOTTOM
                    ? 'bottom'
                    : 'inside'

              return {
                distanceTop,
                distanceBottom,
                region,
                position,
              }
            })
            .filter(Boolean)
        : []) as RegionWithIntersectionDetails[],
    [bottom, intersections, regions, top],
  )

  return (
    <RootWrapper ref={ref}>
      <TopRegionWrapper
        $debug={DEBUG}
        io={io}
        id="::top"
        onIntersection={onIntersection}
        margins={margins}
      />
      <div>{children}</div>
      <OverlayWrapper ref={overlayRef}>
        {overlayWidth && render(regionsWithIntersectionDetails, overlayWidth)}
      </OverlayWrapper>
      {regions.map((region) => {
        const forceWidth = region.rect.width === 0
        return (
          <MiddleRegionWrapper
            key={region.id}
            $debug={DEBUG}
            io={io}
            onIntersection={onIntersection}
            id={region.id}
            style={{
              width: forceWidth ? 1 : region.rect.width,
              left: region.rect.left - (forceWidth ? 1 : 0),
              top: region.rect.top - INTERSECTION_ELEMENT_PADDING,
              height: region.rect.height + INTERSECTION_ELEMENT_PADDING * 2,
            }}
          />
        )
      })}
      <BottomRegionWrapper $debug={DEBUG} id="::bottom" io={io} onIntersection={onIntersection} />
    </RootWrapper>
  )
})
