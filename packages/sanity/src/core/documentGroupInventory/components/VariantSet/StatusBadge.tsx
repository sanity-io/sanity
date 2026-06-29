import {Badge} from '@sanity/ui'
import {getTheme_v2 as getThemeV2} from '@sanity/ui/theme'
import {styled} from 'styled-components'

export const StatusBadge = styled(Badge)(({theme}) => {
  const {space} = getThemeV2(theme)

  return `
  span {
  display: flex;
  align-items: center;
  gap: ${space[2]}px;
  word-break: keep-all;
  white-space: noWrap;
  }
`
})
