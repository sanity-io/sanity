import {styled} from 'styled-components'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'

export const StyledChangeIndicatorWithProvidedFullPath = styled(ChangeIndicator)`
  width: 1px;
  height: 100%;

  & > div {
    height: 100%;
  }
`
