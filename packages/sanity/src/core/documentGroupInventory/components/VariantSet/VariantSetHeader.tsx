import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {css, styled} from 'styled-components'

import {VariantSetEntry} from './VariantSetEntry'

export const VariantSetHeader = styled(VariantSetEntry)(({theme}) => {
  const {radius} = getThemeV2(theme)

  return css`
    background-color: var(--card-muted-bg-color);
    border-radius: ${radius[3]}px ${radius[3]}px 0 0;
  `
})
