/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {CSSProperties} from 'react'
import {RegionIntersectionAssembler} from './RegionIntersectionAssembler'
import {groupBy, orderBy} from 'lodash'
import AvatarProvider from '@sanity/components/lib/presence-new/AvatarProvider'
import Avatar from '@sanity/components/lib/presence-new/Avatar'
import {DEBUG, THRESHOLD_TOP, MAX_AVATARS} from './constants'
import {RegionWithIntersectionDetails} from './types'

const splitRight = (array, index) => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

const ITEM_TRANSITION: CSSProperties = {
  transition: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease-in-out'
}
const ITEM_STYLE: CSSProperties = {
  position: 'sticky',
  pointerEvents: 'all',
  top: 0,
  bottom: 0
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
  regions: any[]
  children: React.ReactElement
  trackerRef: React.RefObject<any>
}

export function PresenceTransitionRenderer(props: Props) {
  return (
    <RegionIntersectionAssembler
      {...props}
      render={(regionsWithIntersectionDetails: RegionWithIntersectionDetails[]) => {
        const maxRight = Math.max(
          ...regionsWithIntersectionDetails.map(
            withIntersection =>
              withIntersection.region.rect.left + withIntersection.region.rect.width
          )
        )
        const grouped = group(regionsWithIntersectionDetails)
        const topSpacing = sum(grouped.top.map(n => n.region.rect.height + n.spacerHeight))
        const bottomSpacing = sum(grouped.bottom.map(n => n.region.rect.height + n.spacerHeight))
        return (
          <>
            {[
              renderTop(grouped.top),
              <Spacer key="spacerTop" height={topSpacing} />,
              ...renderInside(grouped.inside, maxRight),
              <Spacer key="spacerBottom" height={bottomSpacing} />,
              renderBottom(grouped.bottom)
            ]}
          </>
        )
      }}
    />
  )
}

function renderTop(regionsWithIntersectionDetails: RegionWithIntersectionDetails[]) {
  const allPresenceItems = regionsWithIntersectionDetails.flatMap(
    withIntersection => withIntersection.region.data?.presence || []
  )

  const [collapsed, visible] = splitRight(allPresenceItems, MAX_AVATARS)

  const counter = collapsed.length > 0 && (
    <div
      key={collapsed.length > 1 ? 'counter' : collapsed[collapsed.length - 1].sessionId}
      style={{
        ...ITEM_TRANSITION,
        position: 'absolute',
        transform: `translate3d(${visible.length * -28}px, 0px, 0px)`
      }}
    >
      <Avatar position="top" label={collapsed.map(a => a.displayName).join(', ')} color="salmon">
        +{collapsed.length}
      </Avatar>
    </div>
  )

  const visibleItems = visible.map((avatar, i) => (
    <div
      key={avatar.sessionId}
      style={{
        ...ITEM_TRANSITION,
        position: 'absolute',
        transform: `translate3d(${(visible.length - 1 - i) * -28}px, 0px, 0px)`
      }}
    >
      <AvatarProvider position="top" userId={avatar.identity} {...avatar} />
    </div>
  ))

  return (
    <div
      key="sticky-top"
      style={{
        position: 'sticky',
        top: 8,
        bottom: 0,
        right: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {[].concat(counter || []).concat(visibleItems)}
    </div>
  )
}

function renderBottom(regionsWithIntersectionDetails: RegionWithSpacerHeight[]) {
  const allPresenceItems = regionsWithIntersectionDetails
    .flatMap(withIntersection => withIntersection.region.data.presence || [])
    .reverse()

  const [collapsed, visible] = splitRight(allPresenceItems, MAX_AVATARS)

  const counter = collapsed.length > 0 && (
    <div
      key={collapsed.length > 1 ? 'counter' : collapsed[collapsed.length - 1].sessionId}
      style={{
        ...ITEM_TRANSITION,
        // position: 'relative'
        position: 'absolute',
        // top: 0
        transform: `translate3d(${visible.length * -28}px, 0px, 0px)`
      }}
    >
      <Avatar position="bottom" label={collapsed.map(a => a.displayName).join(', ')} color="salmon">
        +{collapsed.length}
      </Avatar>
    </div>
  )

  const visibleItems = visible.map((avatar, i) => (
    <div
      key={avatar.sessionId}
      style={{
        ...ITEM_TRANSITION,
        // position: 'relative'
        position: 'absolute',
        // top: 0
        transform: `translate3d(${(visible.length - 1 - i) * -28}px, 0px, 0px)`
      }}
    >
      <AvatarProvider position="bottom" userId={avatar.identity} {...avatar} />
    </div>
  ))

  return (
    <div
      key="sticky-bottom"
      style={{
        position: 'sticky',
        top: 8,
        bottom: 38,
        right: 0,
        left: 0,
        display: 'flex',
        justifyContent: 'flex-end'
      }}
    >
      {[].concat(counter || []).concat(visibleItems)}
    </div>
  )
}

//  keep for debugging purposes
// function renderAbsolute(entry) {
//   return (
//     <div style={{position: 'absolute', ...entry.item.rect}}>
//       {entry.position}
//       {(entry.item.props.presence || []).map(pr => pr.sessionId).join(', ')}
//     </div>
//   )
// }

// The avatar will move to the right when this close (in pixels) to the top
const topDistanceRightMovementThreshold = 12

function renderInside(regionsWithIntersectionDetails: RegionWithSpacerHeight[], maxRight: number) {
  return regionsWithIntersectionDetails.map(withIntersection => {
    const distanceMaxLeft =
      maxRight - withIntersection.region.rect.width - withIntersection.region.rect.left
    const originalLeft = withIntersection.region.rect.left
    const distanceTop = withIntersection.distanceTop + THRESHOLD_TOP

    const {component: Component, data} = withIntersection.region

    return (
      <React.Fragment key={withIntersection.region.id}>
        <Spacer height={withIntersection.spacerHeight} />
        <div
          style={{
            ...ITEM_STYLE,
            ...ITEM_TRANSITION,
            transform: `translate3d(${originalLeft +
              (distanceTop < topDistanceRightMovementThreshold
                ? distanceMaxLeft
                : 0)}px, 0px, 0px)`,
            transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
            height: withIntersection.region.rect.height,
            width: withIntersection.region.rect.width
          }}
        >
          <DebugValue value={() => distanceTop}>
            {Component ? <Component {...data} /> : null}
          </DebugValue>
        </div>
      </React.Fragment>
    )
  })
}

function DebugValue(props: any) {
  if (!DEBUG) {
    return props.children
  }
  return (
    <div style={{position: 'relative'}}>
      {props.children}
      <span
        style={{
          top: 0,
          left: 0,
          color: 'white',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          padding: 4,
          position: 'absolute'
        }}
      >
        {props.value()}
      </span>
    </div>
  )
}
