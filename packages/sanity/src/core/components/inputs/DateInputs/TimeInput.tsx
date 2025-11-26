import {TextInput} from '@sanity/ui'
import {styled} from 'styled-components'

export const TimeInput = styled(TextInput).attrs(() => ({
  type: 'time',
}))`
  line-height: 1;
`
