import {CheckmarkIcon} from '@sanity/icons'
import {Flex, Stack, Box, Text, Card, Badge} from '@sanity/ui'
import React, {createElement, isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

const STATE_TITLES = {
  'logged-in': '',
  'logged-out': 'Signed out',
  'no-access': '',
}

export const MediaCard = styled(Card)`
  width: 35px;
  height: 35px;

  svg {
    width: 100%;
    height: 100%;
  }
`

const createIcon = (icon: React.ComponentType | React.ReactNode) => {
  if (isValidElementType(icon)) return createElement(icon)
  if (isValidElement(icon)) return icon
  return undefined
}

export interface WorkspacePreviewProps {
  icon?: React.ComponentType | React.ReactNode
  iconRight?: React.ComponentType | React.ReactNode
  selected?: boolean
  state?: 'logged-in' | 'logged-out' | 'no-access'
  subtitle?: string
  title: string
}

/**
 * This Workspace preview component is used in multiple places:
 * 1. As separate buttons in the workspace selector (pre-auth)
 * 2. Within <MenuItems> in the navbar workspace <Menu> (once logged in)
 */
export function WorkspacePreview(props: WorkspacePreviewProps) {
  const {state, subtitle, selected, title, icon, iconRight} = props

  const iconComponent = useMemo(() => createIcon(icon), [icon])
  const iconRightComponent = useMemo(() => createIcon(iconRight), [iconRight])

  return (
    <Flex align="center" flex="none" gap={3} padding={3}>
      <MediaCard radius={2} tone="transparent">
        {iconComponent}
      </MediaCard>

      <Stack flex={1} space={2}>
        <Text size={1} textOverflow="ellipsis" weight="medium">
          {title}
        </Text>

        {subtitle && (
          <Text muted size={1} textOverflow="ellipsis">
            {subtitle}
          </Text>
        )}
      </Stack>

      {state && STATE_TITLES[state] && <Badge marginLeft={1}>{STATE_TITLES[state]}</Badge>}

      {(selected || iconRightComponent) && (
        <Flex align="center" gap={4} paddingLeft={3} paddingRight={2}>
          {selected && (
            <Text>
              <CheckmarkIcon />
            </Text>
          )}

          {iconRightComponent && <Text muted>{iconRightComponent}</Text>}
        </Flex>
      )}
    </Flex>
  )
}
