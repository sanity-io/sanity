import {Box, Card} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {listStyles} from './listStyles'

export const SpaceBox = styled(Box)`
  ${listStyles};
`

export const RootBox = styled(Box)`
  ${SpaceBox}:first-child {
    &:not([data-list-type='number'], [data-list-type='bullet']) {
      margin-top: 0;
    }
  }

  ${SpaceBox}:last-child {
    margin-bottom: 0;
  }
`

export const ListBoxOuter = styled(Box)`
  line-height: 1;
`

export const ListBox = styled(Box)(() => {
  return css`
    &:not([hidden]) {
      position: relative;
      padding-left: 2rem;
      display: inline-flex;
    }

    & > [data-list-prefix] {
      position: absolute;
      width: 3rem;
      left: -2rem;
      text-align: right;

      &[data-list-prefix='bullet'] {
        top: -0.1875em;

        & > span:before {
          content: var(--bullet-marker);
          font-size: 0.46666em;
        }
      }

      &[data-list-prefix='number'] {
        counter-increment: section;

        & > span:before {
          font-size: 1em;
          content: var(--bullet-marker);
        }
      }
    }
  `
})

export const ImageCard = styled(Card)<{$aspectRatio: number; $lqip?: string}>`
  position: relative;
  padding-bottom: ${({$aspectRatio}) => $aspectRatio}%;
  background-image: ${({$lqip}) => `url(${$lqip})`};
  background-size: cover;

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`
