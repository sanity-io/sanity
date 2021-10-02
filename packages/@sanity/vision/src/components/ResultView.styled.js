import styled from 'styled-components'
import {rem} from '@sanity/ui'

export const ReactJsonViewContainer = styled.div`
  .react-json-view {
    font-family: ${({theme}) => theme.sanity.fonts.code.family} !important;
    font-size: ${({theme}) => rem(theme.sanity.fonts.code.sizes[1].fontSize)} !important;
    line-height: inherit;
    // This aligns the top with the CodeMirror lines in the QueryEditor
    padding: 4px 0;
  }
`
