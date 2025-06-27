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

    font-size: 16px;
    line-height: 21px;
  }

  & .cm-line {
    padding-left: ${vars.space[3]};
  }

  & .cm-content {
    border-right-width: ${vars.space[4]} !important;
    padding-top: ${vars.space[5]};
  }
`
