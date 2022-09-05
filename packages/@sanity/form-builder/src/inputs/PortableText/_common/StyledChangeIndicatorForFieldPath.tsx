import {ChangeIndicatorForFieldPath} from '@sanity/base/change-indicators'
import styled, {css} from 'styled-components'

export const StyledChangeIndicatorForFieldPath = styled(ChangeIndicatorForFieldPath)(() => {
  return css`
    width: 1px;
    height: 100%;

    & > div {
      height: 100%;
    }
  `
})
