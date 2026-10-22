import {css} from '#styled-system/css'

export const space2Var = '--presentation-document-header-space-2'
export const space5Var = '--presentation-document-header-space-5'

export const locationStack = css({
  'display': 'flex',
  'flexDirection': 'column',
  'gap': `var(${space2Var})`,
  'minHeight': '2.625rem',
  // rem(42)
  'marginBottom': `var(${space5Var})`,
  '&:empty': {
    display: 'none',
  },
})
