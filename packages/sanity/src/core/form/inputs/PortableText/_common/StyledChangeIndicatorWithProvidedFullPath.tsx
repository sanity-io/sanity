import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {css, styled} from 'styled-components'

export const StyledChangeIndicatorWithProvidedFullPath = styled(ChangeIndicator)(() => {
  return css`
    width: 1px;
    height: 100%;

    & > div {
      height: 100%;
    }
  `
})
