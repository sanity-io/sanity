import {css} from '#styled-system/css'

export const portableTextWrap = css({
  "& > [data-ui='Text']:not(:first-child)": {
    marginTop: '1em',
    // todo: improve
  },
  "& > [data-ui='Text']:empty": {
    display: 'none',
  },
})
