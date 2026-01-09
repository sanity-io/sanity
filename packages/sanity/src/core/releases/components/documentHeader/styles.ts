import {
  Button, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {styled} from 'styled-components'

export const ChipButtonContainer = styled.span`
  display: inline-flex;
  --border-color: var(--card-border-color);
`

export const ChipButton = styled(Button)`
  flex: none;
  transition: none;
  cursor: pointer;
  --card-border-color: var(--border-color);
`
