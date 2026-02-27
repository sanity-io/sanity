import {Box} from '@sanity/ui'
import {styled} from 'styled-components'

export const INCOMING_REFERENCES_ITEM_HEIGHT = 51
export const INCOMING_REFERENCES_MAX_VISIBLE_ITEMS = 10

export const IncomingReferencesListContainer = styled(Box)<{$itemCount: number}>`
  height: ${({$itemCount}) =>
    Math.min($itemCount, INCOMING_REFERENCES_MAX_VISIBLE_ITEMS) *
    INCOMING_REFERENCES_ITEM_HEIGHT}px;
`
