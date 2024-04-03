import {hues} from '@sanity/color'
import {Card, type CardProps} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

interface ThreadCardProps extends Omit<CardProps, 'tone'> {
  theme: Theme
}

export const ThreadCard = styled(Card).attrs({padding: 3, radius: 3, sizing: 'border'})(
  (props: ThreadCardProps) => {
    const {theme} = props
    const isDark = theme.sanity.color.dark
    const activeBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][isDark ? 900 : 50].hex
    const defaultBg = hues.gray[isDark ? 900 : 50].hex

    return css`
      background-color: ${defaultBg};

      &[data-active='true'] {
        background-color: ${activeBg};
      }
    `
  },
)
