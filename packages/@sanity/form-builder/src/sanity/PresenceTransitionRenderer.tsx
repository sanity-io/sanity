/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {groupBy, orderBy} from 'lodash'
import {CSSProperties} from 'react'
import AvatarProvider from '@sanity/components/lib/presence-new/AvatarProvider'
import Avatar from '@sanity/components/lib/presence-new/Avatar'

const split = (array, index) => [array.slice(0, index), array.slice(index)]
const splitRight = (array, index) => {
  const idx = Math.max(0, array.length - index)
  return [array.slice(0, idx), array.slice(idx)]
}

const MAX_AVATARS = 2

const ITEM_TRANSITION: CSSProperties = {
  transition: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease-in-out'
}
const ITEM_STYLE: CSSProperties = {
  ...ITEM_TRANSITION,
  zIndex: 1100,
  position: 'sticky',
  pointerEvents: 'all',
  top: 8,
  bottom: 8
}

const RenderItem = props => {
  const {childComponent: ChildComponent, presence, ...rest} = props
  return <ChildComponent presence={presence} {...rest} />
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

function StickyPresenceTransitionRenderer(props) {
  return (
    <StickyOverlayRenderer
      {...props}
      render={entries => {
        const maxRight = Math.max(
          ...entries.map(record => record.item.rect.left + record.item.rect.width)
        )
        const grouped = group(entries)
        return [
          renderTop(grouped.top, maxRight),
          ...renderGroup(grouped.inside, maxRight),
          ...renderGroup(grouped.bottom, maxRight)
        ]
      }}
    />
  )
}

const Spacer = ({height, ...rest}) => <div style={{height: Math.max(0, height), ...rest?.style}} />

function renderTop(entries, maxRight) {
  const spacerSum = entries.reduce((total, entry) => total + entry.spacerHeight, 0)

  const allPresenceItems = entries.flatMap(entry => entry.item.props.presence || [])

  const [collapsed, visible] = splitRight(allPresenceItems, MAX_AVATARS)

  return (
    <React.Fragment>
      <Spacer height={spacerSum} />
      <div
        style={{
          ...ITEM_STYLE,
          display: 'flex',
          justifyContent: 'flex-end'
        }}
      >
        {collapsed.length > 0 && (
          <div
            key={collapsed.slice(-1)[0].sessionId}
            style={{
              ...ITEM_TRANSITION,
              position: 'absolute',
              transform: `translate3d(${-25 * MAX_AVATARS}px, 0px, 0px)`
            }}
          >
            <Avatar label={collapsed.map(a => a.displayName).join(', ')} color="salmon">
              +{collapsed.length}
            </Avatar>
          </div>
        )}
        {visible.map((p, i) => (
          <div
            key={p.sessionId}
            style={{
              ...ITEM_TRANSITION,
              position: 'absolute',
              transform: `translate3d(${-25 * (visible.length - i -1)}px, 0px, 0px)`
            }}
          >
            <AvatarProvider userId={p.identity} {...p} />
          </div>
        ))}
      </div>
    </React.Fragment>
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

function renderGroup(entries, maxRight) {
  return entries.map(entry => (
    <React.Fragment key={entry.item.id}>
      <Spacer height={entry.spacerHeight} />
      <div
        style={{
          ...ITEM_STYLE,
          transform: `translate3d(${
            entry.position === 'top' || entry.position === 'bottom'
              ? maxRight - entry.item.rect.width - entry.indent
              : entry.item.rect.left
          }px, 0px, 0px)`,
          height: entry.item.rect.height,
          width: entry.item.rect.width
        }}
      >
        <RenderItem {...entry.item.props} />
      </div>
    </React.Fragment>
  ))
}

// export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
