import {Card, Grid} from '@sanity/ui'
import {styled, type StyledComponent} from 'styled-components'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const FieldGroupTabsWrapper: StyledComponent<typeof Card, any, {$level?: number}> = styled(Card)<{$level?: number}>`
  margin-bottom: ${({$level, theme}) => ($level === 0 ? 0 : theme.sanity.space[5] * -1)}px;
  padding-bottom: ${({$level, theme}) =>
    $level === 0 ? theme.sanity.space[4] : theme.sanity.space[4]}px;
`
export const AlignedBottomGrid: StyledComponent<typeof Grid, any> = styled(Grid)`
  align-items: flex-end;
`
