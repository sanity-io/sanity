import {Code} from '@sanity/ui'
import {styled, type StyledComponent} from 'styled-components'

export const ErrorCode: StyledComponent<typeof Code, any> = styled(Code)`
  color: ${({theme}) => theme.sanity.color.muted.critical.enabled.fg};
`
