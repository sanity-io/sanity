import {css} from '#styled-system/css'

// No base `opacity: 1`: Panda emits one atomic class per declaration, ordered by first
// occurrence across the project, so composing with a later `opacity: 1` utility would let
// that rule win over `rootBoxMuted`. The CSS initial value is already 1.
export const rootBox = css({
  position: 'relative',
  transition: 'opacity 0.4s',
})

export const rootBoxMuted = css({
  opacity: 0.8,
})

export const commandListBox = css({
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
})
