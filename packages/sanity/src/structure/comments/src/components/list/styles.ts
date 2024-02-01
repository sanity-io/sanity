import {hues} from '@sanity/color'
import {Card, CardProps} from '@sanity/ui'
import {Theme} from '@sanity/ui/theme'
import styled, {css} from 'styled-components'

interface ThreadCardProps extends Omit<CardProps, 'tone'> {
  theme: Theme
}

export const ThreadCard = styled(Card).attrs({padding: 3, radius: 3, sizing: 'border'})(
  (props: ThreadCardProps) => {
    const {theme} = props
    const isDark = theme.sanity.color.dark
    const activeBg = hues.yellow[isDark ? 900 : 50].hex
    const defaultBg = hues.gray[isDark ? 900 : 50].hex

    return css`
      background-color: ${defaultBg};

      &[data-active='true'] {
        background-color: ${activeBg};
      }
    `
  },
)
