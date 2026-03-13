import {
  Button, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const ChipButtonContainer = styled.span`
  display: inline-flex;
  --border-color: ${vars.color.border};
`

export const ChipButton = styled(Button)`
  flex: none;
  transition: none;
  cursor: pointer;
  --card-border-color: ${vars.color.border};
`
