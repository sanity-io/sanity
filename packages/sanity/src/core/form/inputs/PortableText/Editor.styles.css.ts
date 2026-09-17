import {createVar, globalStyle, style} from '@vanilla-extract/css'

import {TEXT_LEVELS} from './text/constants'
import {createListName} from './text/helpers'

export const root = style({
  flexDirection: 'column',
  selectors: {
    "&[data-fullscreen='true']": {
      height: '100%',
    },
    "&[data-fullscreen='false']": {
      minHeight: '5em',
      resize: 'vertical',
      overflow: 'auto',
      height: '19em',
    },
    // Card sets `display: block` on itself through `&:not([hidden])`
    '&&:not([hidden])': {
      display: 'flex',
    },
  },
})

export const rootOneLine = style({
  selectors: {
    "&[data-fullscreen='false']": {
      resize: 'none',
      height: 'auto',
    },
  },
})

export const toolbarCard = style({
  zIndex: 10,
  lineHeight: 0,
})

export const editableCard = style({
  position: 'relative',
  overflow: ['hidden', 'clip'],
  selectors: {
    '&::selection': {
      backgroundColor: 'transparent',
    },
  },
})

globalStyle(`${editableCard} > [data-portal]`, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  pointerEvents: 'none',
})

globalStyle(`${editableCard} > [data-portal] > *`, {
  pointerEvents: 'initial',
})

globalStyle(`${editableCard} *::selection`, {
  backgroundColor: 'transparent',
})

export const scroller = style({
  position: 'relative',
  overflow: 'auto',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
})

globalStyle(`${scroller} > *`, {
  flex: 1,
  minHeight: 'auto',
})

export const space2Var = createVar()
export const space3Var = createVar()
export const radius2Var = createVar()
export const container1Var = createVar()
/** `space[$isFullscreen ? 5 : 3]` in px */
export const gutterVar = createVar()
/** `rem(space[$isFullscreen ? 5 : 3])` */
export const gutterRemVar = createVar()
/** `$isOneLine ? 0 : space[$isFullscreen ? 9 : 5]` in px */
export const editorPaddingBottomVar = createVar()

export const editableWrapper = style({
  height: '100%',
  width: '100%',
  counterReset: TEXT_LEVELS.map((l) => createListName(l)).join(' '),
  overflow: ['hidden', 'clip'],
})

globalStyle(`${editableWrapper} > div`, {
  height: '100%',
})

const editor = `${editableWrapper} [data-pt-editor]`

globalStyle(editor, {
  display: 'block',
  width: '100%',
  height: '100%',
  paddingBottom: editorPaddingBottomVar,
})

for (const level of TEXT_LEVELS) {
  /* Reset the list count each time a list index of 1 is encountered
   * for the current level.
   */
  globalStyle(`${editor} [data-level='${level}'][data-list-index='1']`, {
    counterSet: `${createListName(level)} 1`,
  })
  /* Otherwise, increment the list count for the current level. */
  globalStyle(`${editor} [data-level='${level}']:not([data-list-index='1'])`, {
    counterIncrement: createListName(level),
  })
}

globalStyle(
  `${editor} > .pt-list-item-bullet + .pt-list-item-number, ${editor} > .pt-list-item-number + .pt-list-item-bullet`,
  {
    marginTop: space3Var,
  },
)

globalStyle(`${editor} > :not(.pt-list-item) + .pt-list-item`, {
  marginTop: space2Var,
})

globalStyle(`${editor} > .pt-list-item + :not(.pt-list-item)`, {
  marginTop: space3Var,
})

globalStyle(`${editor} > :first-child`, {
  paddingTop: gutterVar,
})

globalStyle(`${editor} > [data-pt-block]`, {
  /* Positioning context for the absolutely-positioned drop indicator so it
     sizes to the block (the centred text column) instead of the full-width
     [data-pt-editor], which overshoots the block in fullscreen. */
  position: 'relative',
  margin: '0 auto',
  maxWidth: container1Var,
})

/* Container nodes are consumer-rendered and miss the inner-padding gutter
 * the text-block/object components apply. Padding a container is unreliable
 * (a table ignores it for cell layout), so narrow the box via max-width
 * minus the gutter on both sides instead, centred by the margin auto above. */
globalStyle(`${editor} > [data-pt-block='container']`, {
  width: `calc(100% - 2 * ${gutterVar})`,
  maxWidth: `calc(${container1Var} - 2 * ${gutterVar})`,
})

globalStyle(`${editor} .pt-drop-indicator`, {
  pointerEvents: 'none',
  border: '1px solid var(--card-focus-ring-color) !important',
  height: '0px !important',
  borderRadius: radius2Var,
  marginTop: '-3px',
  left: `calc(${gutterRemVar} - 1px)`,
  right: `calc(${gutterRemVar} - 1px)`,
  width: `calc(100% - 2 * ${gutterRemVar} + 2px) !important`,
})

/* A block nested in a container is its own positioning context, so its drop
   indicator sizes to the block (the cell) instead of escaping to the
   container, and spans the full width: the container owns the gutter. */
globalStyle(`${editor} [data-pt-block] [data-pt-block]`, {
  position: 'relative',
})

globalStyle(`${editor} [data-pt-block] [data-pt-block] .pt-drop-indicator`, {
  left: 0,
  right: 0,
  width: '100% !important',
})
