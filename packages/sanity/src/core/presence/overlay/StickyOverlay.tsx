/* eslint-disable @typescript-eslint/no-use-before-define */

import React, {memo, useMemo} from 'react'
import {flatten, groupBy, orderBy, sortBy} from 'lodash'
import {
  AVATAR_ARROW_HEIGHT,
  AVATAR_DISTANCE,
  AVATAR_SIZE,
  DEBUG,
  MAX_AVATARS_DOCK,
  SLIDE_RIGHT_THRESHOLD_BOTTOM,
  SLIDE_RIGHT_THRESHOLD_TOP,
} from '../constants'
import {
  FieldPresenceData,
  Rect,
  ReportedRegionWithRect,
  RegionWithIntersectionDetails,
} from '../types'
import {FieldPresenceInner} from '../FieldPresence'

import {RegionsWithIntersections} from './RegionsWithIntersections'
import {ReportedPresenceData, useReportedValues} from './tracker'

const ITEM_TRANSITION: React.CSSProperties = {
  transitionProperty: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
}

const bottom = (rect: {top: number; height: number}) => rect.top + rect.height

type RegionWithSpacerHeight = RegionWithIntersectionDetails & {
  spacerHeight: number
}

function withSpacerHeight(
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
): RegionWithSpacerHeight[] {
  return regionsWithIntersectionDetails.map(
    (withIntersection, idx, _regionsWithIntersectionDetails) => {
      const prevRect = _regionsWithIntersectionDetails[idx - 1]?.region.rect
      const prevBottom = prevRect ? bottom(prevRect) : 0
      return {...withIntersection, spacerHeight: withIntersection.region.rect.top - prevBottom}
    }
  )
}

const orderByTop = (regionsWithIntersectionDetails: RegionWithIntersectionDetails[]) =>
  orderBy(regionsWithIntersectionDetails, (withIntersection) => withIntersection.region.rect.top)

const plus = (a: number, b: number) => a + b
const sum = (array: number[]) => array.reduce(plus, 0)

type Margins = [number, number, number, number]
type RegionWithSpacerHeightAndIndent = RegionWithSpacerHeight & {indent: number}

function group(regionsWithIntersectionDetails: RegionWithIntersectionDetails[]): {
  top: RegionWithSpacerHeightAndIndent[]
  inside: RegionWithSpacerHeightAndIndent[]
  bottom: RegionWithSpacerHeightAndIndent[]
} {
  const regionsWithSpacerHeight = withSpacerHeight(orderByTop(regionsWithIntersectionDetails))
  const grouped: {
    top: RegionWithSpacerHeight[]
    inside: RegionWithSpacerHeight[]
    bottom: RegionWithSpacerHeight[]
  } = {
    top: [],
    inside: [],
    bottom: [],
    ...groupBy(regionsWithSpacerHeight, (_withSpacerHeight) => _withSpacerHeight.position),
  }

  return {
    top: orderByTop(grouped.top).map(
      (withIntersection, i, grp): RegionWithSpacerHeightAndIndent => ({
        ...(withIntersection as RegionWithSpacerHeight),
        indent: grp
          .slice(i + 1)
          .reduce((w, _withIntersection) => w + _withIntersection.region.rect.width, 0),
      })
    ),
    inside: orderByTop(grouped.inside).map(
      (withIntersection): RegionWithSpacerHeightAndIndent => ({
        ...(withIntersection as RegionWithSpacerHeight),
        indent: 0,
      })
    ),
    bottom: orderByTop(grouped.bottom).map(
      (withIntersection, i, grp): RegionWithSpacerHeightAndIndent => ({
        ...(withIntersection as RegionWithSpacerHeight),
        indent: grp
          .slice(0, i)
          .reduce((w, _withIntersection) => w + _withIntersection.region.rect.width, 0),
      })
    ),
  }
}

const Spacer = ({height, ...rest}: {height: number; style?: React.CSSProperties}) => (
  <div style={{height: Math.max(0, height), ...rest?.style}} />
)

const DEFAULT_MARGINS: Margins = [0, 0, 0, 0]

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source
  let top = -el.scrollTop
  let left = 0
  while (el && el !== target) {
    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft
    el = el.offsetParent instanceof HTMLElement ? el.offsetParent : null
  }
  return {top, left}
}

function getRelativeRect(element: HTMLElement, parent: HTMLElement): Rect {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight,
  }
}

function regionsWithComputedRects(
  regions: ReportedPresenceData[],
  parent: HTMLElement
): ReportedRegionWithRect<FieldPresenceData>[] {
  return regions.map(([id, region]) => ({
    ...region,
    id,
    rect: getRelativeRect(region.element, parent),
  }))
}

type Props = {margins: Margins; children: React.ReactNode}
export function StickyOverlay(props: Props) {
  const {children, margins = DEFAULT_MARGINS} = props
  const reportedValues = useReportedValues()
  const ref = React.useRef<HTMLDivElement | null>(null)
  const regions = React.useMemo(
    () => (ref.current ? regionsWithComputedRects(reportedValues, ref.current) : EMPTY_ARRAY),
    [reportedValues]
  )

  const renderCallback = React.useCallback(
    (regionsWithIntersectionDetails: RegionWithIntersectionDetails[], containerWidth: any) => {
      const grouped = group(
        regionsWithIntersectionDetails.filter((item) => item.region.presence.length > 0)
      )
      const topSpacing = sum(grouped.top.map((n) => n.region.rect.height + n.spacerHeight))
      const bottomSpacing = sum(
        [...grouped.inside, ...grouped.bottom].map((n) => n.region.rect.height + n.spacerHeight)
      )

      // todo: this needs cleaning up, should process all the needed layout data in one go
      const counts = grouped.inside.reduce(
        (_counts, withIntersection) => {
          const {distanceTop, distanceBottom} = withIntersection

          const nearTop = distanceTop <= SLIDE_RIGHT_THRESHOLD_TOP
          const nearBottom = distanceBottom <= SLIDE_RIGHT_THRESHOLD_BOTTOM
          return {
            nearTop: _counts.nearTop + (nearTop ? withIntersection.region.presence.length : 0),
            nearBottom:
              _counts.nearBottom + (nearBottom ? withIntersection.region.presence.length : 0),
          }
        },
        {nearTop: 0, nearBottom: 0}
      )

      return (
        <>
          <PresenceDock
            closeCount={counts.nearTop}
            margins={margins}
            position="top"
            regionsWithIntersectionDetails={grouped.top}
          />
          <Spacer height={topSpacing} />
          <PresenceInside
            containerWidth={containerWidth}
            regionsWithIntersectionDetails={grouped.inside}
          />
          <Spacer height={bottomSpacing} />
          <PresenceDock
            closeCount={counts.nearBottom}
            margins={margins}
            position="bottom"
            regionsWithIntersectionDetails={grouped.bottom}
          />
        </>
      )
    },
    [margins]
  )

  return (
    <RegionsWithIntersections ref={ref} margins={margins} regions={regions} render={renderCallback}>
      {children}
    </RegionsWithIntersections>
  )
}

const EMPTY_ARRAY: never[] = []

const PresenceDock = memo(function PresenceDock(props: {
  closeCount: number
  margins: Margins
  position: 'top' | 'bottom'
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
}) {
  const {closeCount, margins, position, regionsWithIntersectionDetails} = props
  const dir = position === 'top' ? 1 : -1
  const allPresenceItems = useMemo(() => {
    if (!regionsWithIntersectionDetails.length) {
      return EMPTY_ARRAY
    }

    return flatten(
      sortBy(regionsWithIntersectionDetails, (r) => r.region.rect.top * dir).map(
        (withIntersection) => withIntersection.region.presence || EMPTY_ARRAY
      )
    )
  }, [dir, regionsWithIntersectionDetails])
  const [topMargin, rightMargin, bottomMargin, leftMargin] = margins
  // const leftOffset =
  //   (leftMargin || 0) +
  //   (allPresenceItems.length > 0 ? -closeCount * (AVATAR_SIZE + AVATAR_DISTANCE) : 0) -
  //   rightMargin

  const margin = position === 'top' ? topMargin : bottomMargin

  const style: React.CSSProperties = useMemo(
    () => ({
      zIndex: 2,
      position: 'sticky',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      ...ITEM_TRANSITION,
      // transform: `translate3d(${rightOffset}px, 0px, 0px)`,
      top: AVATAR_ARROW_HEIGHT + 1 + margin,
      bottom: AVATAR_ARROW_HEIGHT + 1 + margin,
    }),
    [margin]
  )

  return (
    <div data-dock={position} key={`sticky-${position}`} style={style}>
      <FieldPresenceInner
        position={position}
        maxAvatars={MAX_AVATARS_DOCK}
        presence={allPresenceItems}
      />
    </div>
  )
})

function PresenceInside(props: {
  containerWidth: number
  regionsWithIntersectionDetails: RegionWithSpacerHeight[]
}) {
  const {regionsWithIntersectionDetails, containerWidth} = props

  return (
    <>
      {regionsWithIntersectionDetails.map((withIntersection) => {
        const originalLeft = withIntersection.region.rect.left
        const {distanceTop, distanceBottom} = withIntersection

        const nearTop = distanceTop <= SLIDE_RIGHT_THRESHOLD_TOP
        const nearBottom = distanceBottom <= SLIDE_RIGHT_THRESHOLD_BOTTOM

        const diffRight = containerWidth - originalLeft - withIntersection.region.rect.width

        const {presence, maxAvatars} = withIntersection.region
        return (
          <React.Fragment key={withIntersection.region.id}>
            <div
              style={{
                zIndex: 2,
                position: 'absolute',
                pointerEvents: 'all',
                ...ITEM_TRANSITION,
                left: originalLeft,
                transform: `translate3d(${nearTop || nearBottom ? diffRight : 0}px, 0px, 0px)`,
                height: withIntersection.region.rect.height,
                top: withIntersection.region.rect.top,
              }}
            >
              <DebugValue value={() => `⤒${distanceTop} | ${distanceBottom}⤓`}>
                <FieldPresenceInner
                  stack={!nearTop && !nearBottom}
                  // eslint-disable-next-line no-nested-ternary
                  position={nearTop ? 'top' : nearBottom ? 'bottom' : 'inside'}
                  maxAvatars={maxAvatars}
                  presence={presence}
                />
              </DebugValue>
            </div>
          </React.Fragment>
        )
      })}
    </>
  )
}

const PassThrough = (props: {children: React.ReactElement; [prop: string]: any}) => props.children

const DebugValue = DEBUG
  ? function DebugValue(props: any) {
      return (
        <div style={{position: 'absolute'}}>
          {props.children}
          <span
            style={{
              top: 0,
              left: -15,
              fontSize: 11,
              right: -15,
              textAlign: 'center',
              height: AVATAR_SIZE,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              position: 'absolute',
              zIndex: 1000,
            }}
          >
            {props.value()}
          </span>
        </div>
      )
    }
  : PassThrough
