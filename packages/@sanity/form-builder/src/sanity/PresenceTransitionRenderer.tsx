/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {CSSProperties} from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {groupBy, orderBy} from 'lodash'
import AvatarProvider from '@sanity/components/lib/presence-new/AvatarProvider'
import Avatar from '@sanity/components/lib/presence-new/Avatar'
import {DEBUG, THRESHOLD_TOP, MAX_AVATARS} from './constants'

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

const RenderItem = props => {
  const {childComponent: ChildComponent, presence = [], ...rest} = props
  return ChildComponent ? <ChildComponent presence={presence} {...rest} /> : null
}

const bottom = rect => rect.top + rect.height

function withSpacerHeight(entries) {
  return entries.map((entry, idx, entries) => {
    const prevRect = entries[idx - 1]?.item.rect
    const prevBottom = prevRect ? bottom(prevRect) : 0
    return {...entry, spacerHeight: entry.item.rect.top - prevBottom}
  })
}

const orderByTop = entries => orderBy(entries, entry => entry.item.rect.top)

const plus = (a, b) => a + b
const sum = array => array.reduce(plus, 0)

function group(entries) {
  const grouped = {
    top: [],
    inside: [],
    bottom: [],
    ...groupBy(withSpacerHeight(orderByTop(entries)), entry => entry.position)
  }

  return {
    top: orderByTop(grouped.top).map((entry, i, grp) => ({
      ...entry,
      indent: grp.slice(i + 1).reduce((w, entry) => w + entry.item.rect.width, 0)
    })),
    inside: orderByTop(grouped.inside).map((entry, i) => ({...entry, indent: 0})),
    bottom: orderByTop(grouped.bottom).map((entry, i, grp) => ({
      ...entry,
      indent: grp.slice(0, i).reduce((w, entry) => w + entry.item.rect.width, 0)
    }))
  }
}

const Spacer = ({height, ...rest}) => {
  return <div style={{height: Math.max(0, height), ...rest?.style}} />
}

function StickyPresenceTransitionRenderer(props) {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        const maxRight = Math.max(
          ...entries.map(record => record.item.rect.left + record.item.rect.width)
        )
        const grouped = group(entries)
        const topSpacing = sum(grouped.top.map(n => n.item.rect.height + n.spacerHeight))
        const bottomSpacing = sum(grouped.bottom.map(n => n.item.rect.height + n.spacerHeight))
        return [
          renderTop(grouped.top),
          <Spacer key="spacerTop" height={topSpacing} />,
          ...renderInside(grouped.inside, maxRight),
          <Spacer key="spacerBottom" height={bottomSpacing} />,
          renderBottom(grouped.bottom)
        ]
      }}
    />
  )
}

function renderTop(entries) {
  const allPresenceItems = entries.flatMap(entry => entry.item.props?.presence || [])

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
        // position: 'relative'
        position: 'absolute',
        // top: 0
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

function renderBottom(entries) {
  const allPresenceItems = entries.flatMap(entry => entry.item.props.presence || []).reverse()

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

function renderInside(entries, maxRight) {
  return entries.map(entry => {
    const distanceMaxLeft = maxRight - entry.item.rect.width - entry.item.rect.left
    const originalLeft = entry.item.rect.left
    const distanceTop = entry.distanceTop + THRESHOLD_TOP

    return (
      <React.Fragment key={entry.item.id}>
        <Spacer height={entry.spacerHeight} />
        <div
          style={{
            ...ITEM_STYLE,
            ...ITEM_TRANSITION,
            transform: `translate3d(${originalLeft +
              (distanceTop < topDistanceRightMovementThreshold
                ? distanceMaxLeft
                : 0)}px, 0px, 0px)`,
            // transitionDuration: '2s',
            transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)',
            height: entry.item.rect.height,
            width: entry.item.rect.width
          }}
        >
          <DebugValue value={() => distanceTop}>
            <RenderItem {...entry.item.props} />
          </DebugValue>
        </div>
      </React.Fragment>
    )
  })
}

function DebugValue(props) {
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

// export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
