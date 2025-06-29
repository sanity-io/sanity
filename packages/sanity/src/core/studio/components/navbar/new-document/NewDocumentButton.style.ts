import {Card, Flex} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {css, styled} from 'styled-components'

import {Dialog, Popover} from '../../../../../ui-components'

export const StyledPopover = styled(Popover)`
  [data-ui='Popover__wrapper'] {
    width: 320px;
    display: flex;
    flex-direction: column;
    border-radius: ${vars.radius[3]};
    position: relative;
    overflow: hidden;
    overflow: clip;
  }
`

// We are using `flex-start` to make sure that the dialogs doesn't jump around when
// the content changes. This is because the dialog is centered by default, and
// when the content changes, the dialog will jump to the center of the screen.
export const StyledDialog = styled(Dialog)`
  [data-ui='DialogCard'] {
    justify-content: flex-start;
  }
`

export const RootFlex = styled(Flex)``

export const PopoverHeaderCard = styled(Card)`
  min-height: max-content;
`

export const DialogHeaderCard = styled(Card)`
  min-height: max-content;
`

export const PopoverListFlex = styled(Flex)<{
  $maxDisplayedItems: number
  $itemHeight: number
}>((props) => {
  const {$maxDisplayedItems, $itemHeight} = props

  // Calculate the max height of the list.
  // We want the max height to be the height of the list items multiplied by the max number of items.
  return css`
    --item-height: ${$itemHeight}px;
    --max-items: ${$maxDisplayedItems};
    --list-padding: 0.5rem;

    position: relative;
    max-height: calc(var(--item-height) * var(--max-items) + var(--list-padding));
    min-height: calc((var(--item-height) * 1));
  `
})
