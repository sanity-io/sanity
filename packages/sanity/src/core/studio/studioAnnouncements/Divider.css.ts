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

/**
 * Panda orders atomic rules by value, so `opacity: 1` above would win an equal-specificity tie;
 * the doubled class makes the hidden state win.
 */
export const dividerHrHidden = css({
  '&&': {
    opacity: 0,
  },
})
