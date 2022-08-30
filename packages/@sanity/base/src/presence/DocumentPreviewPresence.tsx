import type {User} from '@sanity/types'
import {AvatarStack, Box, Card, Text, Theme, Tooltip, TooltipProps} from '@sanity/ui'
import React, {useMemo} from 'react'
import styled, {css, useTheme} from 'styled-components'
import {UserAvatar, usePreviewCard} from '../components'

interface DocumentPreviewPresenceProps {
  presence: User[]
}

const PRESENCE_MENU_POPOVER_PROPS: TooltipProps = {
  portal: true,
  scheme: 'light',
}

const AvatarStackCard = styled(Card)(({theme, $selected}: {theme: Theme; $selected: boolean}) => {
  const {color} = theme.sanity

  return css`
    --card-bg-color: inherit;
    --card-fg-color: inherit;
    --card-hairline-hard-color: ${$selected ? color.selectable.default.pressed.border : undefined};
  `
})

const TooltipContentBox = styled(Box)`
  max-width: 150px;
`

const getTooltipText = (presence: User[]) => {
  if (presence.length === 1) {
    return `${presence[0].displayName} is editing this document`
  }

  if (presence.length > 1) {
    return `${presence.length} people are editing this document right now`
  }

  return undefined
}

export function DocumentPreviewPresence(props: DocumentPreviewPresenceProps) {
  const {presence} = props
  const {color} = useTheme().sanity
  const invertedScheme = color.dark ? 'light' : 'dark'
  const {selected} = usePreviewCard()

  const tooltipContent = useMemo(() => {
    return (
      <TooltipContentBox padding={2}>
        <Text align="center" size={1}>
          {getTooltipText(presence)}
        </Text>
      </TooltipContentBox>
    )
  }, [presence])

  return (
    <Tooltip content={tooltipContent} {...PRESENCE_MENU_POPOVER_PROPS}>
      <AvatarStackCard scheme={selected ? invertedScheme : undefined} $selected={selected}>
        <AvatarStack maxLength={2}>
          {presence.map((user) => (
            <UserAvatar key={user.id} user={user} />
          ))}
        </AvatarStack>
      </AvatarStackCard>
    </Tooltip>
  )
}
