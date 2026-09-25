import {styleVariants} from '@vanilla-extract/css'

// touch-action: none is required for @dnd-kit's PointerSensor (configured in
// ./list.tsx) to receive touch input. Without it, the browser's default
// touch action (scrolling) wins on mobile and array items can't be
// reordered. See https://github.com/sanity-io/sanity/issues/12931 and
// https://docs.dndkit.com/api-documentation/sensors/pointer#recommendations.
// Keep default touch behavior when disabled/readOnly so scrolling still works.
export const dragHandleButton = styleVariants({
  disabled: {
    touchAction: 'auto',
  },
  list: {
    cursor: 'ns-resize',
    touchAction: 'none',
  },
  grid: {
    cursor: 'move',
    touchAction: 'none',
  },
})
