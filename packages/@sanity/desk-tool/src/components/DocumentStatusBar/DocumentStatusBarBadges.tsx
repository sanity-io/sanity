/* eslint-disable react/no-multi-comp */
import {useEditState} from '@sanity/react-hooks'
import React from 'react'
import Badge from 'part:@sanity/components/badges/default'

import styles from './DocumentStatusBarBadges.css'
import resolveDocumentBadges from 'part:@sanity/base/document-badges/resolver'

export interface Badge {
  label: string
  title: string
  color: 'success' | 'failure' | 'warning'
}

interface Props {
  badgeStates: Badge[]
}

function DocumentStatusBarBadgesInner(props: Props) {
  console.log(props.badgeStates)
  if (props.badgeStates.length === 0) {
    return null
  }
  return (
    <div className={styles.statusBadges}>
      {props.badgeStates.map((badge, i) => (
        <Badge key={i} color={badge.color} title={badge.title}>
          {badge.label}
        </Badge>
      ))}
    </div>
  )
}

export function DocumentStatusBarBadges(props: {id: string; type: string}) {
  const editState = useEditState(props.id, props.type)
  const badges = editState ? resolveDocumentBadges(editState) : null
  return badges ? (
    <RenderDocumentBadgeState
      component={DocumentStatusBarBadgesInner}
      badges={badges}
      badgeProps={editState}
    />
  ) : null
}

interface RenderBadgeCollectionProps {
  badges: any[]
  badgeProps: any
  component: (args: {badgeStates: any[]}) => React.ReactNode
}

const badgeIds = new WeakMap()

let counter = 0
const getBadgeId = badge => {
  if (badgeIds.has(badge)) {
    return badgeIds.get(badge)
  }
  const id = `${badge.name || badge.displayName || '<anonymous>'}-${counter++}`
  badgeIds.set(badge, id)
  return id
}

export function RenderDocumentBadgeState(props: RenderBadgeCollectionProps) {
  const [badgesWithStates, setBadgesWithState] = React.useState([])

  const onStateChange = React.useCallback(
    stateUpdate => {
      setBadgesWithState(prevState => {
        return props.badges.map((badge: any) => {
          const id = getBadgeId(badge)
          return stateUpdate[0] === id
            ? [id, stateUpdate[1]]
            : prevState.find(prev => prev[0] === id) || [id]
        })
      })
    },
    [props.badges]
  )

  const {badges: _, badgeProps, component, ...rest} = props

  return (
    <>
      {component({
        badgeStates: badgesWithStates
          .map(([id, state]) => state && {...state, badgeId: id})
          .filter(Boolean),
        ...rest
      })}

      {props.badges.map(badge => {
        const badgeId = getBadgeId(badge)
        return (
          <BadgeStateContainer
            key={badgeId}
            badge={badge}
            id={badgeId}
            badgeProps={props.badgeProps}
            onUpdate={onStateChange}
          />
        )
      })}
    </>
  )
}

const BadgeStateContainer = React.memo(function BadgeStateContainer(props: any) {
  const {id, badge, onUpdate, badgeProps} = props

  const state = badge(badgeProps)
  onUpdate([id, state ? state : null])
  return null
})
