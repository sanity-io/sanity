import styled from 'styled-components'
import {rem} from '@sanity/ui'

export const ReactJsonViewContainer = styled.div`
  padding-bottom: ${({theme}) =>
    rem(
      theme.sanity.space[3] * 2 +
        theme.sanity.fonts.text.sizes[2].lineHeight -
        theme.sanity.fonts.text.sizes[2].ascenderHeight -
        theme.sanity.fonts.text.sizes[2].descenderHeight
    )};

  .react-json-view {
    font-family: ${({theme}) => theme.sanity.fonts.code.family} !important;
    font-size: ${({theme}) => rem(theme.sanity.fonts.code.sizes[1].fontSize)} !important;
    line-height: inherit;
    // This aligns the top with the CodeMirror lines in the QueryEditor
    padding: 4px 0;
  }
`
