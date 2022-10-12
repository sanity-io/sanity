import {Card} from '@sanity/ui'
import styled from 'styled-components'
import {MOVING_ITEM_CLASS_NAME} from '../common/sortable'

export const ItemCard = styled(Card)`
  position: relative;
  border: 1px solid transparent;
  transition: border-color 250ms;
  .dragHandle {
    color: var(--card-shadow-umbra-color);
  }
  &:hover {
    border-color: var(--card-shadow-umbra-color);
    .dragHandle {
      color: inherit;
    }
  }
  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
  .${MOVING_ITEM_CLASS_NAME} & {
    box-shadow: 0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }
`
