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
  color: ${vars.color.code.fg};
  background-color: ${vars.color.bg};

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
    caret-color: ${vars.color.focusRing};
  }

  & .cm-cursor,
  & .cm-dropCursor {
    border-left-color: ${vars.color.focusRing};
  }

  & .cm-editor.cm-focused .cm-selectionBackground,
  & .cm-selectionBackground,
  & .cm-content ::selection {
    background-color: ${vars.color.tinted.default.bg[2]};
  }

  & .cm-panels {
    background-color: ${vars.color.bg};
    color: ${vars.color.fg};
  }

  & .cm-panels.cm-panels-top {
    border-bottom: 2px solid ${vars.color.border};
  }
`
