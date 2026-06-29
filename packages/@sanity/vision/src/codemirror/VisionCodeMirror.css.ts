import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const linePaddingLeftVar = createVar()
export const contentBorderRightWidthVar = createVar()
export const contentPaddingTopVar = createVar()

export const editorRoot = style({
  width: '100%',
  boxSizing: 'border-box',
  height: '100%',
  overflow: ['hidden', 'clip'],
  position: 'relative',
  display: 'flex',
})

globalStyle(`${editorRoot} .cm-theme`, {
  width: '100%',
})

globalStyle(`${editorRoot} .cm-editor`, {
  height: '100%',
  fontSize: '16px',
  lineHeight: '21px',
})

globalStyle(`${editorRoot} .cm-line`, {
  paddingLeft: linePaddingLeftVar,
})

globalStyle(`${editorRoot} .cm-content`, {
  borderRightWidth: `${contentBorderRightWidthVar} !important`,
  paddingTop: contentPaddingTopVar,
})
