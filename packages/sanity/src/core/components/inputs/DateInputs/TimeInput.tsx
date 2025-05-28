import {styled} from 'styled-components'

import {LazyTextInput} from './LazyTextInput'

export const TimeInput = styled(LazyTextInput).attrs(() => ({
  type: 'time',
}))`
  line-height: 1;
`
