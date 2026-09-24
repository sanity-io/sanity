import {css} from '#styled-system/css'

export const root = css({
  // When rendered as a ui5 `Box`, its `position`, `flex*` and `padding*` props map to
  // single-class utilities in the static ui5 stylesheet; the runtime-injected class always
  // outranked them by insertion order, so beat them by specificity instead.
  '&&': {
    position: 'relative',
    flex: 1,
    paddingLeft: '1px',
  },
})
