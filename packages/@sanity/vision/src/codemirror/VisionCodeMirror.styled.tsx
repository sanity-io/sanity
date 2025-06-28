import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const EditorRoot = styled.div`
  width: 100%;
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  overflow: clip;
  position: relative;
  display: flex;

  & .cm-theme {
    width: 100%;
  }

  & .cm-editor {
    height: 100%;

    font-family: ${vars.font.code.family};
    font-size: ${vars.font.code.scale[1].fontSize};
    line-height: ${vars.font.code.scale[1].lineHeight};
  }

  & .cm-line {
    padding-left: ${vars.space[3]};
  }

  & .cm-content {
    border-right-width: ${vars.space[4]} !important;
    padding-top: ${vars.space[5]};
  }
`
