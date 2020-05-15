/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {CSSProperties} from 'react'
import {RegionsWithIntersections} from './RegionsWithIntersections'
import {flatten, groupBy, orderBy, sortBy} from 'lodash'
import {
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
      render={(regionsWithIntersectionDetails: RegionWithIntersectionDetails[]) => {
        const maxRight = Math.max(
          ...regionsWithIntersectionDetails.map(
            withIntersection =>
              withIntersection.region.rect.left + withIntersection.region.rect.width
          )
        )
        const grouped = group(regionsWithIntersectionDetails)
        const topSpacing = sum(grouped.top.map(n => n.region.rect.height + n.spacerHeight))
        const bottomSpacing = sum(
          [...grouped.inside, ...grouped.bottom].map(n => n.region.rect.height + n.spacerHeight)
        )
        return (
          <>
            {[
              renderDock('top', margins, grouped.top),
              <Spacer key="spacerTop" height={topSpacing} />,
              ...renderInside(grouped.inside, maxRight),
              <Spacer key="spacerBottom" height={bottomSpacing} />,
              renderDock('bottom', margins, grouped.bottom)
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
  regionsWithIntersectionDetails: RegionWithIntersectionDetails[]
) {
  const dir = position === 'top' ? 1 : -1
  const allPresenceItems = flatten(
    sortBy(regionsWithIntersectionDetails, r => r.region.rect.top * dir).map(
      withIntersection => withIntersection.region.data?.presence || []
    ) || []
  )

  const margin = position === 'top' ? margins[0] : margins[2]
  const arrowHeight = 4
  return (
    <div
      data-dock={position}
      key={`sticky-${position}`}
      style={{
        position: 'sticky',
        top: arrowHeight + 1 + margin,
        bottom: arrowHeight + 1,
        right: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      <FieldPresenceInner position={position} presence={allPresenceItems} />
    </div>
  )
}

function renderInside(regionsWithIntersectionDetails: RegionWithSpacerHeight[], maxRight: number) {
  return regionsWithIntersectionDetails.map(withIntersection => {
    const distanceMaxLeft =
      maxRight - withIntersection.region.rect.width - withIntersection.region.rect.left
    const originalLeft = withIntersection.region.rect.left
    const {distanceTop, distanceBottom} = withIntersection

    const nearTop = distanceTop + SNAP_TO_DOCK_DISTANCE_TOP < SLIDE_RIGHT_THRESHOLD_TOP
    const nearBottom = distanceBottom + SNAP_TO_DOCK_DISTANCE_BOTTOM < SLIDE_RIGHT_THRESHOLD_BOTTOM

    const {component: Component, data} = withIntersection.region
    return (
      <React.Fragment key={withIntersection.region.id}>
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'all',
            ...ITEM_TRANSITION,
            transform: `translate3d(${originalLeft +
              (nearTop || nearBottom ? distanceMaxLeft : 0)}px, 0px, 0px)`,
            height: withIntersection.region.rect.height,
            width: withIntersection.region.rect.width,
            top: withIntersection.region.rect.top
          }}
        >
          <DebugValue value={() => `⤒${distanceTop} | ${distanceBottom}⤓`}>
            {Component ? <Component {...data} /> : null}
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
