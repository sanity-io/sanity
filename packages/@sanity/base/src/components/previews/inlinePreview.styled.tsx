import {Box} from '@sanity/ui'
import styled from 'styled-components'

export const Root = styled.span`
  display: inline-block;
  position: relative;
  line-height: 1;
`

export const MediaWrapper = styled(Box)`
  display: inline-block;
  vertical-align: top;
  position: relative;

  &:not([hidden]) {
    display: inline-block;
  }

  > img {
    height: calc(14 / 16 * 1em);
    margin: 1px 0;
    display: block;
    object-fit: cover;
  }

  > svg {
    display: block;
    font-size: calc(14 / 16 * 1em);
    margin: 1px 0;

    &[data-sanity-icon='true'] {
      font-size: calc(18 / 16 * 1em);
      margin: calc(1px + (2 / 18 * -1em)) 0;
    }
  }

  > div {
    display: inline-block;
  }
`

export const InheritedText = styled(Box).attrs({as: 'span'})`
  font-size: inherit;
  line-height: inherit;
  vertical-align: top;

  &:empty {
    display: none;
  }
`
