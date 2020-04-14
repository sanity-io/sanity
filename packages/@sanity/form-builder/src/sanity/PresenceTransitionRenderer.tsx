/* eslint-disable react/jsx-no-bind */
/* eslint-disable react/no-multi-comp */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from 'react'
import {StickyOverlayRenderer} from './StickyOverlayRenderer'
import {groupBy, orderBy} from 'lodash'
import {CSSProperties} from 'react'

const split = (array, index) => [array.slice(0, index), array.slice(index)]

const MAX_AVATARS = 1

const ITEM_STYLE: CSSProperties = {
  zIndex: 1100,
  transition: 'transform',
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease-in-out',
  position: 'sticky',
  pointerEvents: 'all',
  top: 8,
  bottom: 8
}

const RenderInside = props => {
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
          renderInside(grouped.top, maxRight),
          renderInside(grouped.inside, maxRight),
          renderInside(grouped.bottom, maxRight)
        ]
      }}
    />
  )
}

function renderTop(entries, maxRight) {
  return entries.map((entry, i) => {
    const {
      childComponent: ChildComponent,
      avatarComponent: AvatarComponent,
      presence,
      ...rest
    } = entry.item.props
    return (
      <React.Fragment key={entry.item.id}>
        <div style={{height: Math.max(0, entry.spacerHeight)}} />
        {presence?.map((p, i) => {
          return (
            <>
              <div
                style={{
                  ...ITEM_STYLE,
                  backgroundColor: 'black',
                  transform: `translate3d(${maxRight -
                    entry.item.rect.width / presence.length -
                    entry.indent -
                    (entry.item.rect.width / presence.length) * i}px, 0px, 0px)`,
                  height: entry.item.rect.height,
                  width: entry.item.rect.width / presence.length
                }}
              >
                <AvatarComponent {...p} userId={p.identity} />
              </div>
            </>
          )
        })}
      </React.Fragment>
    )
  })
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

function renderInside(entries, maxRight) {
  return entries.map(entry => (
    <React.Fragment key={entry.item.id}>
      <div style={{height: Math.max(0, entry.spacerHeight)}} />
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
        <RenderInside {...entry.item.props} />
      </div>
    </React.Fragment>
  ))
}

// export const PresenceTransitionRenderer = AbsoluteOverlayRenderer
export const PresenceTransitionRenderer = StickyPresenceTransitionRenderer
