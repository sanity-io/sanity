import {Box, Card, Flex, Label, rem, Text} from '@sanity/ui'
import {css, styled, type StyledComponent} from 'styled-components'

export const Root: StyledComponent<typeof Flex, any> = styled(Flex)`
  .sidebarPanes .Pane {
    overflow-y: auto;
    overflow-x: hidden;
  }

  & .Resizer {
    background: var(--card-border-color);
    opacity: 1;
    z-index: 1;
    box-sizing: border-box;
    background-clip: padding-box;
    border: solid transparent;
  }

  & .Resizer:hover {
    border-color: var(--card-shadow-ambient-color);
  }

  & .Resizer.horizontal {
    height: 11px;
    margin: -5px 0;
    border-width: 5px 0;
    cursor: row-resize;
    width: 100%;
    z-index: 4;
  }

  & .Resizer.vertical {
    width: 11px;
    margin: 0 -5px;
    border-width: 0 5px;
    cursor: col-resize;
    z-index: 2; /* To prevent the resizer from being hidden behind CodeMirror scroll area */
  }

  .Resizer.disabled {
    cursor: not-allowed;
  }

  .Resizer.disabled:hover {
    border-color: transparent;
  }
`

Root.displayName = 'Root'

export const Header: StyledComponent<typeof Card, any> = styled(Card)`
  border-bottom: 1px solid var(--card-border-color);
`

export const StyledLabel: StyledComponent<typeof Label, any> = styled(Label)`
  flex: 1;
`

export const SplitpaneContainer: StyledComponent<typeof Box, any> = styled(Box)`
  position: relative;
`

export const QueryCopyLink: StyledComponent<'a', any> = styled.a`
  cursor: pointer;
  margin-right: auto;
`

export const InputBackgroundContainer: StyledComponent<typeof Box, any> = styled(Box)`
  position: absolute;
  top: 1rem;
  left: 0;
  padding: 0;
  margin: 0;
  z-index: 10;
  right: 0;

  ${StyledLabel} {
    user-select: none;
  }
`

export const InputBackgroundContainerLeft: StyledComponent<typeof InputBackgroundContainer, any> =
  styled(InputBackgroundContainer)`
    // This is so its aligned with the gutters of CodeMirror
    left: 33px;
  `

export const InputContainer: StyledComponent<typeof Card, any> = styled(Card)`
  width: 100%;
  height: 100%;
  position: relative;
  flex-direction: column;
`

export const ResultOuterContainer: StyledComponent<typeof Flex, any> = styled(Flex)`
  height: 100%;
`

export const ResultInnerContainer: StyledComponent<typeof Box, any> = styled(Box)`
  position: relative;
`

export const ResultContainer: StyledComponent<typeof Card, any, {$isInvalid: boolean}> = styled(
  Card,
)<{$isInvalid: boolean}>`
  height: 100%;
  width: 100%;
  position: absolute;
  max-width: 100%;

  ${({$isInvalid}) =>
    $isInvalid &&
    css`
      &:after {
        background-color: var(--card-bg-color);
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 100%;
      }
    `}
`

export const Result: StyledComponent<typeof Box, any> = styled(Box)`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 20;
`

export const ResultFooter: StyledComponent<typeof Flex, any> = styled(Flex)`
  border-top: 1px solid var(--card-border-color);
`

export const TimingsCard: StyledComponent<typeof Card, any> = styled(Card)`
  position: relative;
`

export const TimingsContainer: StyledComponent<typeof Box, any> = styled(Box)`
  width: 100%;
  height: 100%;
`

export const TimingsTextContainer: StyledComponent<typeof Flex, any> = styled(Flex)`
  height: 100%;
  min-height: ${({theme}) =>
    rem(
      theme.sanity.space[3] * 2 +
        theme.sanity.fonts.text.sizes[2].lineHeight -
        theme.sanity.fonts.text.sizes[2].ascenderHeight -
        theme.sanity.fonts.text.sizes[2].descenderHeight,
    )};
`

export const DownloadsCard: StyledComponent<typeof Card, any> = styled(Card)`
  position: relative;
`

export const SaveResultLabel: StyledComponent<typeof Text, any> = styled(Text)`
  transform: initial;
  &:before,
  &:after {
    content: none;
  }
  > span {
    display: flex !important;
    gap: ${({theme}) => rem(theme.sanity.space[3])};
    align-items: center;
  }
`

export const ControlsContainer: StyledComponent<typeof Box, any> = styled(Box)`
  border-top: 1px solid var(--card-border-color);
`
