import {Text, Box, MenuItem, Theme, Flex, ButtonTone} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {TimelineItemState} from './types'

export interface TimelineItemProps {
  state: TimelineItemState
  theme: Theme
}

export const IconWrapper = styled(Flex)`
  --timeline-hairline-width: 1.3px;
  position: relative;
  z-index: 2;
  margin: 0;
  padding: 0;

  &::before {
    position: absolute;
    content: '';
    height: 100%;
    width: var(--timeline-hairline-width);
    background: var(--card-border-color);
    top: 0;
    left: calc((100% - var(--timeline-hairline-width)) / 2);
    z-index: 1;
  }
`

export const Root = styled(MenuItem)(({state = 'enabled', theme}: TimelineItemProps) => {
  const {color} = theme.sanity

  const selectedState = color.button.default.primary.enabled
  return css`
    position: relative;
    min-width: 244px;

    ${state === 'selected' &&
    css`
      --card-bg-color: ${selectedState.bg};
      --card-fg-color: ${selectedState.fg};
      --card-muted-fg-color: ${selectedState.muted};
      --card-border-color: ${selectedState.bg};
      &:not([data-selection-bottom='true']) {
        border-top-left-radius: 0;
        border-top-right-radius: 0;
      }
    `}

    ${state === 'withinSelection' &&
    css`
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      box-shadow: 0px 3px 0px 0px var(--card-bg-color);
      &:not([data-selection-top='true']) {
        border-radius: 0;
      }
    `}

      ${state === 'disabled' &&
    css`
      [data-ui='Avatar'] {
        opacity: 0.2;
      }
    `}

      &:first-child ${IconWrapper}::before {
      height: 50%;
      top: unset;
      bottom: 0;
    }

    &:last-child ${IconWrapper}::before {
      height: 50%;
    }
  `
})

export const IconBox = styled(Box)`
  background: var(--card-bg-color);
  border-radius: 50px;
  position: relative;
  z-index: 2;
`

export const EventLabel = styled(Text)`
  text-transform: capitalize;
`
