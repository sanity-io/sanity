import {Card} from '@sanity/ui'
import styled from 'styled-components'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const FieldGroupTabsWrapper = styled(Card)<{$level?: number}>`
  margin-bottom: ${({$level, theme}) => ($level === 0 ? 0 : theme.sanity.space[5] * -1)}px;
  padding-bottom: ${({$level, theme}) =>
    $level === 0 ? theme.sanity.space[4] : theme.sanity.space[4]}px;
`
