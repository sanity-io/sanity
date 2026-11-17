import {css} from '#styled-system/css'

export const hiddenOverlay = css({
  background: 'transparent',
  height: '100%',
  left: 0,
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: -1,
})
