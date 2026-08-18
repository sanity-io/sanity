import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefAttributes,
} from 'react'

import {DEBUG, INTERSECTION_ELEMENT_PADDING, INTERSECTION_THRESHOLDS} from '../constants'
import {
  type FieldPresenceData,
  type RegionWithIntersectionDetails,
  type ReportedRegionWithRect,
} from '../types'
import {getPresenceOverlayPosition} from './getPresenceOverlayPosition'
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
const EMPTY_REGION_DETAILS: RegionWithIntersectionDetails[] = []

function hasPresenceElement(
  region: ReportedRegionWithRect<FieldPresenceData>,
): region is ReportedRegionWithRect<FieldPresenceData> & {element: HTMLElement} {
  return Boolean(region.presence?.length && region.element)
}

function getRegionsWithIntersectionDetails(
  regions: ReportedRegionWithRect<FieldPresenceData>[],
  topSentinel: HTMLElement,
  bottomSentinel: HTMLElement,
): RegionWithIntersectionDetails[] {
  const topRect = topSentinel.getBoundingClientRect()
  const bottomRect = bottomSentinel.getBoundingClientRect()

  return regions.filter(hasPresenceElement).map((region): RegionWithIntersectionDetails => {
    const box = region.element.getBoundingClientRect()
    const position = getPresenceOverlayPosition({
      presenceTop: box.top,
      presenceBottom: box.bottom,
      scrollportTop: topRect.bottom,
      scrollportBottom: bottomRect.top,
    })

    return {
      distanceTop: box.top - topRect.bottom,
      distanceBottom: bottomRect.top - box.bottom,
      region,
      position,
    }
  })
}

export function RegionsWithIntersections(
  props: RegionsWithIntersectionsProps & RefAttributes<HTMLDivElement>,
) {
  const {
    ref,
    regions,
    render,
    children,
    margins: [mt, mr, mb, ml],
  } = props

  const overlayRef = useRef<HTMLDivElement | null>(null)
  const topSentinelRef = useRef<HTMLDivElement | null>(null)
  const bottomSentinelRef = useRef<HTMLDivElement | null>(null)
  const regionsRef = useRef(regions)

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

  const [regionsWithIntersectionDetails, setRegionsWithIntersectionDetails] =
    useState<RegionWithIntersectionDetails[]>(EMPTY_REGION_DETAILS)

  const updateFromSentinels = useCallback(() => {
    const topSentinel = topSentinelRef.current
    const bottomSentinel = bottomSentinelRef.current
    if (!topSentinel || !bottomSentinel) {
      setRegionsWithIntersectionDetails(EMPTY_REGION_DETAILS)
      return
    }

    setRegionsWithIntersectionDetails(
      getRegionsWithIntersectionDetails(regionsRef.current, topSentinel, bottomSentinel),
    )
  }, [])

  const onIntersection = useCallback(() => {
    updateFromSentinels()
  }, [updateFromSentinels])

  const [overlayWidth, setOverlayWidth] = useState(0)
  useLayoutEffect(() => {
    regionsRef.current = regions
  }, [regions])
  useLayoutEffect(() => {
    if (!overlayRef.current) return undefined

    setOverlayWidth(overlayRef.current.offsetWidth)

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setOverlayWidth(entry.contentRect.width)
      }
      updateFromSentinels()
    })

    observer.observe(overlayRef.current)

    return () => observer.disconnect()
  }, [updateFromSentinels])

  return (
    <RootWrapper ref={ref}>
      <TopRegionWrapper
        ref={topSentinelRef}
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
      <BottomRegionWrapper
        ref={bottomSentinelRef}
        $debug={DEBUG}
        id="::bottom"
        io={io}
        onIntersection={onIntersection}
      />
    </RootWrapper>
  )
}
