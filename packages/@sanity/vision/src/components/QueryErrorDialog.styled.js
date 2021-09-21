import {Code} from '@sanity/ui'
import styled from 'styled-components'

export const ErrorCode = styled(Code)`
  color: ${({theme}) => theme.sanity.color.muted.critical.enabled.fg};
`
