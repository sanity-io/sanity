import styled, {css} from 'styled-components'
import {ChangeIndicatorWithProvidedFullPath} from '../../../../components'

export const StyledChangeIndicatorWithProvidedFullPath = styled(
  ChangeIndicatorWithProvidedFullPath
)(() => {
  return css`
    width: 1px;
    height: 100%;

    & > div {
      height: 100%;
    }
  `
})
