/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {groupBy, orderBy} from 'lodash'
import Avatar from '@sanity/components/lib/presence-new/Avatar'
import {AbsoluteOverlayRenderer} from './AbsoluteOverlayRenderer'
import {THRESHOLD_TOP} from './constants'

const TRANSITION = {
  transitionProperty: 'all',
  transitionDuration: '0.4s'
}

const RenderItem = ({childComponent: ChildComponent, ...props}) => {
  const presence = props.presence || []
  return (
    <div
      style={{
        display: 'flex'
      }}
    >
      {presence.map(presence => (
        <Avatar
          position={props.position}
          key={presence.sessionId}
          userId={presence.identity}
          {...presence}
        />
      ))}
    </div>
  )
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

function group(entries) {
  const grouped = {
    top: [],
    inside: [],
    bottom: [],
    ...groupBy(withSpacerHeight(orderByTop(entries)), entry => entry.position)
  }

  return [
    ...orderByTop(grouped.top).map((entry, i, grp) => ({
      ...entry,
      indent: grp.slice(i + 1).reduce((w, entry) => w + entry.item.rect.width, 0)
    })),
    ...orderByTop(grouped.inside).map((entry, i) => ({...entry, indent: 0})),
    ...orderByTop(grouped.bottom).map((entry, i, grp) => ({
      ...entry,
      indent: grp.slice(0, i).reduce((w, entry) => w + entry.item.rect.width, 0)
    }))
  ]
}

function StickyPresenceTransitionRenderer(props) {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        const grouped = group(entries)
        const maxRight = Math.max(
          ...grouped.map(record => record.item.rect.left + record.item.rect.width)
        )
        return grouped.map(record => renderSticky(record, maxRight))
      }}
    />
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

function renderSticky(entry, maxRight) {
  return (
    <React.Fragment key={entry.item.id}>
      <div style={{height: Math.max(0, entry.spacerHeight)}} />
      <div
        style={{
          zIndex: 1100,
          transition: 'transform',
          transitionDuration: '200ms',
          transitionTimingFunction: 'ease-in-out',
          transform: `translate3d(${
            entry.position === 'top' || entry.position === 'bottom'
              ? maxRight - entry.item.rect.width - entry.indent
              : entry.item.rect.left
          }px, 0px, 0px)`,
          position: 'sticky',
          pointerEvents: 'all',
          height: entry.item.rect.height,
          width: entry.item.rect.width,
          top: 8,
          bottom: 8
        }}
      >
        <RenderItem {...entry.item.props} position={entry.position} />
      </div>
    </React.Fragment>
  )
}

// export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
