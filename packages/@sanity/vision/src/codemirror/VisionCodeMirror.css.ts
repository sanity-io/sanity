import {css, firstThatWorks} from '#styled-system/css'

// Custom properties `EditorRoot` sets inline from the theme
export const linePaddingLeftVar = '--vision-cm-line-padding-left'
export const contentBorderRightWidthVar = '--vision-cm-content-border-right-width'
export const contentPaddingTopVar = '--vision-cm-content-padding-top'

export const editorRoot = css({
  'width': '100%',
  'boxSizing': 'border-box',
  'height': '100%',
  'overflow': firstThatWorks('clip', 'hidden'),
  'position': 'relative',
  'display': 'flex',
  '& .cm-theme': {
    width: '100%',
  },
  '& .cm-editor': {
    height: '100%',
    fontSize: '16px',
    lineHeight: '21px',
  },
  '& .cm-line': {
    paddingLeft: `var(${linePaddingLeftVar})`,
  },
  '& .cm-content': {
    borderRightWidth: `var(${contentBorderRightWidthVar}) !important`,
    paddingTop: `var(${contentPaddingTopVar})`,
  },
})
