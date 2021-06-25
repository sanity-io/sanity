import React from 'react'
import styled from 'styled-components'
import {Flex, Card, Text, rem} from '@sanity/ui'
import {RestoreIcon} from '@sanity/icons'
import {ChunkType} from '@sanity/field/lib/diff'
import {getTimelineEventIconComponent} from '../timeline/helpers'
import {Badge} from './types'

interface Props extends Badge {
  type: 'live' | ChunkType
  title?: string
  style?: React.CSSProperties
}

const Icon = styled.div`
  height: 100%;
  width: 100%;

  [data-ui='Text'] {
    color: inherit;
    line-height: 1;
  }
`

const BadgeWrapper = styled(Card)`
  ${({theme}) => `
    --publish-bg: ${theme.sanity.color.solid.positive.enabled.bg};
    --publish-fg: ${theme.sanity.color.solid.positive.enabled.fg};
    --publish-border: ${theme.sanity.color.solid.positive.enabled.border};
  `}
  --badge-size: ${({theme}) => rem(theme.sanity.avatar.sizes[0].size)};
  border-radius: 40px;
  height: var(--badge-size);
  width: var(--badge-size);
  cursor: inherit;
  flex: 1;

  [data-ui='Text']:not([hidden]) {
    color: inherit;
  }

  &[data-type='publish'],
  &[data-type='live'] {
    background-color: var(--publish-bg);
    color: var(--publish-fg);
    border: 1px solid var(--publish-fg);
  }

  &[data-type='editDraft'],
  &[data-type='unpublish'] {
    background-color: var(--draft-bg);
    color: var(--draft-fg);
    border: 1px solid var(--draft-fg);
  }

  [data-badge-icon-hover] {
    display: none;
  }

  // Only show icon inside a badge if it's the last one/on the top
  &:not([data-type='publish']):not([data-type='live']):not(:last-of-type) [data-badge-icon] {
    display: none;
  }

  &[data-syncing='true']:last-of-type [data-sanity-icon] {
    animation-name: documentStatusBar-badge-sync;
    animation-duration: 1.5s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  @keyframes documentStatusBar-badge-sync {
    0% {
      transform: rotate(0);
    }

    100% {
      transform: rotate(360deg);
    }
  }
`

export const SessionBadge = ({type, title, icon, ...restProps}: Props) => {
  const iconComponent =
    type && type !== 'live' ? getTimelineEventIconComponent(type) || <code>{type}</code> : icon
  return (
    <Card as={BadgeWrapper as any} data-type={type} title={title} {...restProps}>
      <Flex align="center" justify="center" height="fill">
        <Flex as={Icon} align="center" justify="center">
          <Text size={1} data-badge-icon>
            {React.createElement(icon || iconComponent)}
          </Text>
          <Text size={1} data-badge-icon-hover>
            <RestoreIcon />
          </Text>
        </Flex>
      </Flex>
    </Card>
  )
}
