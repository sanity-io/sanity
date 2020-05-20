/* eslint-disable react/no-multi-comp,@typescript-eslint/no-use-before-define */
import * as React from 'react'
import {CSSProperties} from 'react'
import {RegionsWithIntersections} from './RegionsWithIntersections'
import {flatten, groupBy, orderBy, sortBy} from 'lodash'
import {
  AVATAR_DISTANCE,
  AVATAR_SIZE,
  DEBUG,
  SLIDE_RIGHT_THRESHOLD_BOTTOM,
  SLIDE_RIGHT_THRESHOLD_TOP,
  SNAP_TO_DOCK_DISTANCE_BOTTOM,
  SNAP_TO_DOCK_DISTANCE_TOP
} from '../constants'
import {RegionWithIntersectionDetails} from '../types'
import {FieldPresenceInner} from '../FieldPresence'
import {OverlayItem} from '../overlay-reporter'

const ITEM_TRANSITION: CSSProperties = {
  transitionProperty: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)'
}

const bottom = rect => rect.top + rect.height

type RegionWithSpacerHeight = RegionWithIntersectionDetails & {
  spacerHeight: number
}

function withSpacerHeight(
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
): RegionWithSpacerHeight[] {
  return regionsWithIntersectionDetails.map(
    (withIntersection, idx, regionsWithIntersectionDetails) => {
      const prevRect = regionsWithIntersectionDetails[idx - 1]?.region.rect
      const prevBottom = prevRect ? bottom(prevRect) : 0
      return {...withIntersection, spacerHeight: withIntersection.region.rect.top - prevBottom}
    }
  )
}

const orderByTop = (regionsWithIntersectionDetails: RegionWithIntersectionDetails[]) =>
  orderBy(regionsWithIntersectionDetails, withIntersection => withIntersection.region.rect.top)

const plus = (a, b) => a + b
const sum = array => array.reduce(plus, 0)

type Margins = [number, number, number, number]
type RegionWithSpacerHeightAndIndent = RegionWithSpacerHeight & {indent: number}

function group(
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
): {
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
    ...groupBy(regionsWithSpacerHeight, withSpacerHeight => withSpacerHeight.position)
  }

  return {
    top: orderByTop(grouped.top).map(
      (withIntersection: RegionWithSpacerHeight, i, grp): RegionWithSpacerHeightAndIndent => ({
        ...withIntersection,
        indent: grp
          .slice(i + 1)
          .reduce((w, withIntersection) => w + withIntersection.region.rect.width, 0)
      })
    ),
    inside: orderByTop(grouped.inside).map(
      (withIntersection: RegionWithSpacerHeight): RegionWithSpacerHeightAndIndent => ({
        ...withIntersection,
        indent: 0
      })
    ),
    bottom: orderByTop(grouped.bottom).map(
      (withIntersection: RegionWithSpacerHeight, i, grp): RegionWithSpacerHeightAndIndent => ({
        ...withIntersection,
        indent: grp
          .slice(0, i)
          .reduce((w, withIntersection) => w + withIntersection.region.rect.width, 0)
      })
    )
  }
}

const Spacer = ({height, ...rest}: {height: number; style?: CSSProperties}) => (
  <div style={{height: Math.max(0, height), ...rest?.style}} />
)

type Props = {
  regions: OverlayItem[]
  children: React.ReactElement
  trackerRef: React.RefObject<any>
  margins: Margins
}
const DEFAULT_MARGINS: Margins = [0, 0, 0, 0]

export function StickyOverlayRenderer(props: Props) {
  const {regions, children, trackerRef, margins = DEFAULT_MARGINS} = props
  return (
    <RegionsWithIntersections
      margins={margins}
      regions={regions}
      trackerRef={trackerRef}
      render={(regionsWithIntersectionDetails: RegionWithIntersectionDetails[], containerWidth) => {
        const grouped = group(
          regionsWithIntersectionDetails.filter(item => item.region.data.presence.length > 0)
        )
        const topSpacing = sum(grouped.top.map(n => n.region.rect.height + n.spacerHeight))
        const bottomSpacing = sum(
          [...grouped.inside, ...grouped.bottom].map(n => n.region.rect.height + n.spacerHeight)
        )

        // todo: this needs cleaning up, should process all the needed layout data in one go
        const counts = grouped.inside.reduce(
          (counts, withIntersection) => {
            const {distanceTop, distanceBottom} = withIntersection

            const nearTop = distanceTop <= SLIDE_RIGHT_THRESHOLD_TOP
            const nearBottom = distanceBottom <= SLIDE_RIGHT_THRESHOLD_BOTTOM
            return {
              nearTop:
                counts.nearTop + (nearTop ? withIntersection.region.data.presence.length : 0),
              nearBottom:
                counts.nearBottom + (nearBottom ? withIntersection.region.data.presence.length : 0)
            }
          },
          {nearTop: 0, nearBottom: 0}
        )
        return (
          <>
            {[
              renderDock('top', margins, grouped.top, counts.nearTop),
              <Spacer key="spacerTop" height={topSpacing} />,
              ...renderInside(grouped.inside, containerWidth),
              <Spacer key="spacerBottom" height={bottomSpacing} />,
              renderDock('bottom', margins, grouped.bottom, counts.nearBottom)
            ]}
          </>
        )
      }}
    >
      {children}
    </RegionsWithIntersections>
  )
}

function renderDock(
  position: 'top' | 'bottom',
  margins: Margins,
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[],
  closeCount
) {
  const dir = position === 'top' ? 1 : -1
  const allPresenceItems = flatten(
    sortBy(regionsWithIntersectionDetails, r => r.region.rect.top * dir).map(
      withIntersection => withIntersection.region.data?.presence || []
    ) || []
  )
  const leftOffset = allPresenceItems.length > 0 ? -closeCount * (AVATAR_SIZE + AVATAR_DISTANCE) : 0
  const margin = position === 'top' ? margins[0] : margins[2]
  const arrowHeight = 4
  return (
    <div
      data-dock={position}
      key={`sticky-${position}`}
      style={{
        position: 'sticky',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        ...ITEM_TRANSITION,
        transform: `translate3d(${leftOffset}px, 0px, 0px)`,
        top: arrowHeight + 1 + margin,
        bottom: arrowHeight + 1 + margin
      }}
    >
      <FieldPresenceInner position={position} presence={allPresenceItems} />
    </div>
  )
}

function renderInside(
  regionsWithIntersectionDetails: RegionWithSpacerHeight[],
  containerWidth: number
) {
  return regionsWithIntersectionDetails.map(withIntersection => {
    const originalLeft = withIntersection.region.rect.left
    const {distanceTop, distanceBottom} = withIntersection

    const nearTop = distanceTop <= SLIDE_RIGHT_THRESHOLD_TOP
    const nearBottom = distanceBottom <= SLIDE_RIGHT_THRESHOLD_BOTTOM

    const diffRight = containerWidth - originalLeft - withIntersection.region.rect.width

    const {presence} = withIntersection.region.data
    return (
      <React.Fragment key={withIntersection.region.id}>
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'all',
            ...ITEM_TRANSITION,
            left: originalLeft,
            transform: `translate3d(${nearTop || nearBottom ? diffRight : 0}px, 0px, 0px)`,
            height: withIntersection.region.rect.height,
            top: withIntersection.region.rect.top
          }}
        >
          <DebugValue value={() => `⤒${distanceTop} | ${distanceBottom}⤓`}>
            <FieldPresenceInner
              stack={!nearTop && !nearBottom}
              position={nearTop ? 'top' : nearBottom ? 'bottom' : 'inside'}
              presence={presence}
            />
          </DebugValue>
        </div>
      </React.Fragment>
    )
  })
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
              zIndex: 1000
            }}
          >
            {props.value()}
          </span>
        </div>
      )
    }
  : PassThrough
