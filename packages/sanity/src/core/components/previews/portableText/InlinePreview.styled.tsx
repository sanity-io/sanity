import {Text} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

export const RootSpan = styled.span`
  display: inline-flex;
  align-items: center;
  vertical-align: top;
  height: calc(1em - 1px);
  max-width: 100%;
`

export const MediaSpan = styled.span`
  position: relative;
  display: inline-block;
  width: calc(1em - 1px);
  height: calc(1em - 1px);
  min-width: calc(1em - 1px);

  & img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: ${vars.radius[1]};
  }

  & img + span {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    box-shadow: inset 0 0 0 1px ${vars.color.fg};
    opacity: 0.2;
    border-radius: ${vars.radius[1]};
  }

  & svg {
    display: block;
    font-size: calc(14 / 16 * 1em);
    margin: 1px 0;

    &[data-sanity-icon] {
      font-size: calc(18 / 16 * 1em);
      margin: calc(1px + (2 / 18 * -1em)) 0;
    }
  }
`

export const TextSpan = styled(Text).attrs({forwardedAs: 'span'})(() => {
  const textSize = vars.font.text.scale[1]

  return css`
    font-size: calc(${textSize.fontSize} / 16 * 1em);
    font-weight: ${vars.font.text.weight.medium};
    box-sizing: border-box;
    display: inline-block;
    vertical-align: top;
    line-height: ${textSize.lineHeight};
    padding-left: 0.5em;
    padding-right: calc(0.5em - 2px);
    min-width: 0;

    & > span {
      display: block;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      overflow: clip;
    }
  `
})
