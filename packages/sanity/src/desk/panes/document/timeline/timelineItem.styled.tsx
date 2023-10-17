import {Text, Box, Button, Flex, rem} from '@sanity/ui'
import styled, {css} from 'styled-components'

export const IconWrapper = styled(Flex)(({theme}) => {
  const borderColor = theme.sanity.color.base.skeleton?.from

  return css`
    --timeline-hairline-width: 1px;
    position: relative;
    z-index: 2;
    margin: 0;
    padding: 0;

    &::before {
      position: absolute;
      content: '';
      height: 100%;
      width: var(--timeline-hairline-width);
      background: ${borderColor};
      top: 0;
      left: calc((100% - var(--timeline-hairline-width)) / 2);
      z-index: 1;
    }
  `
})

export const Root = styled(Button)<{
  $selected: boolean
  $disabled: boolean
}>(({$selected, $disabled}) => {
  return css`
    position: relative;
    width: 100%;

    /* Line styling */
    &[data-first] ${IconWrapper}::before {
      height: 50%;
      top: unset;
      bottom: 0;
    }

    &[data-last] ${IconWrapper}::before {
      height: 50%;
    }

    ${$selected &&
    css`
      ${IconWrapper}::before {
        background: transparent;
      }
    `}

    ${$disabled &&
    css`
      cursor: not-allowed;
    `}
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

export const TimestampBox = styled(Box)`
  min-width: 1rem;
  margin-left: ${({theme}) => `-${rem(theme.sanity.space[1])}`};
`
