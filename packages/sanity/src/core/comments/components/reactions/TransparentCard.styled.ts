import {Card} from '@sanity/ui-v3'
import {styled} from 'styled-components'

/**
 * Returns a styled `<Card>` without a background.
 * This is a temporary workaround to force nested Sanity UI components to adhere to a specific tone (and bypass color mixing).
 *
 * TODO: consider exposing an unstable prop in Sanity UI to facilitate this.
 */
export const TransparentCard = styled(Card)`
  background: none;
`
