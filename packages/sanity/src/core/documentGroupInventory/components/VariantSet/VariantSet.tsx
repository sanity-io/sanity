import {Card} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

export const VariantSet = styled(Card)(({theme}) => {
  const {color} = getThemeV2(theme)

  return `
  display: grid !important;
  /* Leading checkbox, the version, then its status icons. */
  grid-template-columns: min-content 1fr min-content;
  column-gap: var(--space-3);

  * + & {
    border-block-start: 1px solid ${color.border};
  }
`
})
