import {Card, Grid} from '@sanity/ui'
import {styled} from 'styled-components'

// The negative margins here removes the extra space between the tabs and the fields when inside of a grid
export const FieldGroupTabsWrapper = styled(Card)<{$level?: number}>`
  margin-bottom: ${({$level, theme}) => ($level === 0 ? 0 : theme.sanity.space[5] * -1) /* oxlint-disable-line no-deprecated -- will fix in follow up PR */}px;
  padding-bottom: ${({$level, theme}) =>
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    $level === 0 ? theme.sanity.space[4] : theme.sanity.space[4]}px;
`
export const AlignedBottomGrid = styled(Grid)`
  align-items: flex-end;
`
