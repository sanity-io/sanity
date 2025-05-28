import {Card, Flex, Layer, Text, TextSkeleton, type Theme} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {css, styled} from 'styled-components'

interface RootProps {
  $border?: boolean
}

export const Root = styled(Layer)<RootProps>(({$border}) => {
  return css`
    line-height: 0;
    position: sticky;
    top: 0;

    &:not([data-collapsed]):after {
      content: '';
      display: block;
      position: absolute;
      left: 0;
      right: 0;
      bottom: -1px;
      border-bottom: 1px solid ${$border ? 'var(--card-border-color)' : 'transparent'};
      opacity: 1;
    }
  `
})

export const Layout = styled(Flex)`
  transform-origin: calc(51px / 2);

  [data-collapsed] > div > & {
    transform: rotate(90deg);
  }
`

export const TitleCard = styled(Card)(({theme}: {theme: Theme}) => {
  const {fg, bg} = theme.sanity.color.card.enabled

  // Disable color updates on hover
  return css`
    background-color: ${bg};

    [data-ui='Text'] {
      color: ${fg};
    }
  `
})

export const TitleTextSkeleton = styled(TextSkeleton)`
  width: 66%;
  max-width: 175px;
`

export const TitleText = styled(Text)`
  cursor: default;
  outline: none;
`
