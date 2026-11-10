import {css} from '#styled-system/css'

export const rootBox = css({
  position: 'relative',
  opacity: 1,
  transition: 'opacity 0.4s',
})

// Doubled class so it beats the `opacity` of `rootBox` when both are set: Panda orders the rules
// of a property by value (`0.8` before `1`), so the order the classes are declared in does not
// decide the tie the way it did with vanilla-extract.
export const rootBoxMuted = css({
  '&&': {
    opacity: 0.8,
  },
})

export const commandListBox = css({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
})
