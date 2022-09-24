import styled from 'styled-components'

import {Button, Inline} from '@sanity/ui'

export const ButtonContainer = styled(Button)`
  z-index: 100;
`

export const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
`
