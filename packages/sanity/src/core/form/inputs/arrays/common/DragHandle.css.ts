import {css} from '#styled-system/css'

// touch-action: none is required for @dnd-kit's PointerSensor (configured in
// ./list.tsx) to receive touch input. Without it, the browser's default
// touch action (scrolling) wins on mobile and array items can't be
// reordered. See https://github.com/sanity-io/sanity/issues/12931 and
// https://docs.dndkit.com/api-documentation/sensors/pointer#recommendations.
// Keep default touch behavior when disabled/readOnly so scrolling still works.
export const dragHandleButton = {
  disabled: css({
    touchAction: 'auto',
  }),
  list: css({
    cursor: 'ns-resize',
    touchAction: 'none',
  }),
  grid: css({
    cursor: 'move',
    touchAction: 'none',
  }),
}
