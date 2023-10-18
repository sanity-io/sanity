import {AvatarStack, Card, Theme} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled, {css, useTheme} from 'styled-components'
import {usePreviewCard, UserAvatar} from '../components'
import {Tooltip} from '../../ui'
import {DocumentPresence} from '../store'
import {isNonNullable} from '../util'

/** @internal */
export interface DocumentPreviewPresenceProps {
  presence: Omit<DocumentPresence, 'path'>[]
}

const AvatarStackCard = styled(Card)(({theme, $selected}: {theme: Theme; $selected?: boolean}) => {
  const {color} = theme.sanity

  return css`
    --card-bg-color: inherit;
    --card-fg-color: inherit;
    --card-hairline-hard-color: ${$selected ? color.selectable?.default.pressed.border : undefined};
  `
})

const getTooltipText = (presence: Omit<DocumentPresence, 'path'>[]) => {
  if (presence.length === 1) {
    return `${presence[0].user.displayName} is editing this document`
  }

  if (presence.length > 1) {
    return `${presence.length} people are editing this document right now`
  }

  return undefined
}

/** @internal */
export function DocumentPreviewPresence(props: DocumentPreviewPresenceProps) {
  const {presence} = props
  const {color} = useTheme().sanity
  const invertedScheme = color.dark ? 'light' : 'dark'
  const {selected} = usePreviewCard()

  const uniqueUsers = useMemo(
    () =>
      Array.from(new Set(presence.map((a) => a.user.id)))
        .map((id) => {
          return presence.find((a) => a.user.id === id)
        })
        .filter(isNonNullable),
    [presence],
  )

  const tooltipText = useMemo(() => {
    return getTooltipText(uniqueUsers)
  }, [uniqueUsers])

  return (
    <Tooltip text={tooltipText ?? ''} disabled={!tooltipText}>
      <AvatarStackCard scheme={selected ? invertedScheme : undefined} $selected={selected}>
        <AvatarStack maxLength={2} aria-label={tooltipText}>
          {uniqueUsers.map((item) => (
            <UserAvatar key={item.user.id} user={item.user} />
          ))}
        </AvatarStack>
      </AvatarStackCard>
    </Tooltip>
  )
}
