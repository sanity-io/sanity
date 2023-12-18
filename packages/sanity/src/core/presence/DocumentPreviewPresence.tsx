/* eslint-disable camelcase */

import {AvatarStack} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled, {css} from 'styled-components'
import {getTheme_v2} from '@sanity/ui/theme'
import {UserAvatar} from '../components'
import {DocumentPresence} from '../store'
import {isNonNullable} from '../util'
import {Tooltip, TooltipProps} from '../../ui-components'

/** @internal */
export interface DocumentPreviewPresenceProps {
  presence: Omit<DocumentPresence, 'path'>[]
}

const PRESENCE_MENU_POPOVER_PROPS: TooltipProps = {
  portal: true,
}

const AvatarStackBox = styled.div((props) => {
  const {space} = getTheme_v2(props.theme)

  return css`
    margin: ${0 - space[1]}px;
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

  const uniqueUsers = useMemo(
    () =>
      Array.from(new Set(presence.map((a) => a.user.id)))
        .map((id) => {
          return presence.find((a) => a.user.id === id)
        })
        .filter(isNonNullable),
    [presence],
  )

  const tooltipContent = useMemo(() => getTooltipText(uniqueUsers), [uniqueUsers])

  return (
    <Tooltip content={tooltipContent} {...PRESENCE_MENU_POPOVER_PROPS}>
      <AvatarStackBox>
        <AvatarStack maxLength={2} aria-label={getTooltipText(uniqueUsers)} size={0}>
          {uniqueUsers.map((item) => (
            <UserAvatar key={item.user.id} size={0} user={item.user} />
          ))}
        </AvatarStack>
      </AvatarStackBox>
    </Tooltip>
  )
}
