import {hues} from '@sanity/color'
import {Card} from '@sanity/ui'
import {css, styled} from 'styled-components'

import {COMMENTS_HIGHLIGHT_HUE_KEY} from '../../constants'

export const ThreadCard = styled(Card).attrs({padding: 3, radius: 3, sizing: 'border'})<{
  $isDark: boolean
}>((props) => {
  const {$isDark} = props

  const activeBg = hues[COMMENTS_HIGHLIGHT_HUE_KEY][$isDark ? 900 : 50].hex
  const defaultBg = hues.gray[$isDark ? 900 : 50].hex

  return css`
    background-color: ${defaultBg};

    &[data-active='true'] {
      background-color: ${activeBg};
    }
  `
})
