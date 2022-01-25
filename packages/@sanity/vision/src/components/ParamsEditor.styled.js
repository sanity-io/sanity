/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-unassigned-import */
import {UnControlled as BaseReactCodeMirror} from 'react-codemirror2'
import styled, {css} from 'styled-components'
import {rem} from '@sanity/ui'

require('codemirror/mode/javascript/javascript')
require('codemirror/addon/hint/show-hint')
require('codemirror/addon/edit/closebrackets')

export const ReactCodeMirror = styled(BaseReactCodeMirror)`
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  flex: 1;
  overflow: hidden;
  position: relative;

  .CodeMirror {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    font-family: ${({theme}) => theme.sanity.fonts.code.family};
    font-size: ${({theme}) => rem(theme.sanity.fonts.code.sizes[1].fontSize)};
    line-height: inherit;
  }

  & > .CodeMirror:after {
    background-color: ${({$isInvalid}) => $isInvalid && css`var(--card-bg-color)`};
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 100%;
    pointer-events: none;
    z-index: 0;
  }

  .CodeMirror-sizer {
    padding-top: ${({theme}) => rem(theme.sanity.space[5])};
  }

  .CodeMirror-linenumber {
    padding: 0 3px 0 5px;
    min-width: 1.5rem;
    text-align: right;
    color: var(--card-code-fg-color);
    white-space: nowrap;
  }

  .CodeMirror-gutters {
    background-color: var(--card-code-bg-color) !important;
  }
`
