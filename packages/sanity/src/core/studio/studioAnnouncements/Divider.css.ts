import {css} from '#styled-system/css'

export const dividerHr = css({
  height: '1px',
  background: 'var(--card-border-color)',
  width: '100%',
  opacity: 1,
  transition: 'opacity 0.3s ease',
  margin: 0,
  border: 'none',
})

/** Follows `dividerHr` on the same element; `&&` keeps its `opacity` winning. */
export const dividerHrHidden = css({
  '&&': {
    opacity: 0,
  },
})
