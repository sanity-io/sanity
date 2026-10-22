import {css, firstThatWorks} from '#styled-system/css'

export const root = css({
  'flexDirection': 'column',
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
})

export const rootOneLine = css({
  // `&&` wins over the `root` rule this modifier follows on the same element
  "&&[data-fullscreen='false']": {
    resize: 'none',
    height: 'auto',
  },
})

export const toolbarCard = css({
  zIndex: 10,
  lineHeight: 0,
})

export const editableCard = css({
  'position': 'relative',
  'overflow': firstThatWorks('clip', 'hidden'),
  '&::selection': {
    backgroundColor: 'transparent',
  },
  '& > [data-portal]': {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  '& > [data-portal] > *': {
    pointerEvents: 'initial',
  },
  '& *::selection': {
    backgroundColor: 'transparent',
  },
})

export const scroller = css({
  'position': 'relative',
  'overflow': 'auto',
  'height': '100%',
  'display': 'flex',
  'flexDirection': 'column',
  '& > *': {
    flex: 1,
    minHeight: 'auto',
  },
})

export const editableContent = css({
  "&[data-fullscreen='true']": {
    height: '100%',
  },
  "&[data-fullscreen='false']": {
    height: 'auto',
  },
})

export const space2Var = '--editor-space-2'
export const space3Var = '--editor-space-3'
export const radius2Var = '--editor-radius-2'
export const container1Var = '--editor-container-1'
/** `space[$isFullscreen ? 5 : 3]` in px */
export const gutterVar = '--editor-gutter'
/** `rem(space[$isFullscreen ? 5 : 3])` */
export const gutterRemVar = '--editor-gutter-rem'
/** `$isOneLine ? 0 : space[$isFullscreen ? 9 : 5]` in px */
export const editorPaddingBottomVar = '--editor-padding-bottom'

export const editableWrapper = css({
  'height': '100%',
  'width': '100%',
  // `createListName()` for each of `TEXT_LEVELS`
  'counterReset':
    'list-level-1 list-level-2 list-level-3 list-level-4 list-level-5 list-level-6 list-level-7 list-level-8 list-level-9 list-level-10',
  'overflow': firstThatWorks('clip', 'hidden'),
  '& > div': {
    height: '100%',
  },
  // The table plugin (`object/TablePlugin.tsx`) sets `font-weight` on the `<td>`, but Sanity UI's
  // `Text` sets its own weight and breaks the inheritance, so header text needs this rule
  // (`.pt-plugin-table` is rendered by `@portabletext/plugin-table/ui` on its `<table>`).
  "& .pt-plugin-table td[data-pt-plugin-table-header] [data-ui='Text']": {
    fontWeight: 'var(--pt-plugin-table-header-weight, 600)',
  },
  '& [data-pt-editor]': {
    'display': 'block',
    'width': '100%',
    'height': '100%',
    'paddingBottom': `var(${editorPaddingBottomVar})`,
    /* Reset the list count each time a list index of 1 is encountered for the current level,
     * otherwise increment the list count for the current level (one pair per `TEXT_LEVELS`). */
    "& [data-level='1'][data-list-index='1']": {
      counterSet: 'list-level-1 1',
    },
    "& [data-level='1']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-1',
    },
    "& [data-level='2'][data-list-index='1']": {
      counterSet: 'list-level-2 1',
    },
    "& [data-level='2']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-2',
    },
    "& [data-level='3'][data-list-index='1']": {
      counterSet: 'list-level-3 1',
    },
    "& [data-level='3']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-3',
    },
    "& [data-level='4'][data-list-index='1']": {
      counterSet: 'list-level-4 1',
    },
    "& [data-level='4']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-4',
    },
    "& [data-level='5'][data-list-index='1']": {
      counterSet: 'list-level-5 1',
    },
    "& [data-level='5']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-5',
    },
    "& [data-level='6'][data-list-index='1']": {
      counterSet: 'list-level-6 1',
    },
    "& [data-level='6']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-6',
    },
    "& [data-level='7'][data-list-index='1']": {
      counterSet: 'list-level-7 1',
    },
    "& [data-level='7']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-7',
    },
    "& [data-level='8'][data-list-index='1']": {
      counterSet: 'list-level-8 1',
    },
    "& [data-level='8']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-8',
    },
    "& [data-level='9'][data-list-index='1']": {
      counterSet: 'list-level-9 1',
    },
    "& [data-level='9']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-9',
    },
    "& [data-level='10'][data-list-index='1']": {
      counterSet: 'list-level-10 1',
    },
    "& [data-level='10']:not([data-list-index='1'])": {
      counterIncrement: 'list-level-10',
    },
    '& > .pt-list-item-bullet + .pt-list-item-number, & > .pt-list-item-number + .pt-list-item-bullet':
      {
        marginTop: `var(${space3Var})`,
      },
    '& > :not(.pt-list-item) + .pt-list-item': {
      marginTop: `var(${space2Var})`,
    },
    '& > .pt-list-item + :not(.pt-list-item)': {
      marginTop: `var(${space3Var})`,
    },
    '& > :first-child': {
      paddingTop: `var(${gutterVar})`,
    },
    '& > [data-pt-block]': {
      /* Positioning context for the absolutely-positioned drop indicator so it
         sizes to the block (the centred text column) instead of the full-width
         [data-pt-editor], which overshoots the block in fullscreen. */
      position: 'relative',
      margin: '0 auto',
      maxWidth: `var(${container1Var})`,
    },
    /* Container nodes are consumer-rendered and miss the inner-padding gutter
     * the text-block/object components apply. Padding a container is unreliable
     * (a table ignores it for cell layout), so narrow the box via max-width
     * minus the gutter on both sides instead, centred by the margin auto above. */
    // The extra `[data-pt-block]` keeps this above the block rule above, which it followed
    "& > [data-pt-block][data-pt-block='container']": {
      width: `calc(100% - 2 * var(${gutterVar}))`,
      maxWidth: `calc(var(${container1Var}) - 2 * var(${gutterVar}))`,
    },
    '& .pt-drop-indicator': {
      pointerEvents: 'none',
      border: '1px solid var(--card-focus-ring-color)',
      height: '0px',
      borderRadius: `var(${radius2Var})`,
      marginTop: '-3px',
      left: `calc(var(${gutterRemVar}) - 1px)`,
      right: `calc(var(${gutterRemVar}) - 1px)`,
      width: `calc(100% - 2 * var(${gutterRemVar}) + 2px)`,
    },
    /* A block nested in a container is its own positioning context, so its drop
       indicator sizes to the block (the cell) instead of escaping to the
       container, and spans the full width: the container owns the gutter. */
    '& [data-pt-block] [data-pt-block]': {
      'position': 'relative',
      '& .pt-drop-indicator': {
        left: 0,
        right: 0,
        width: '100%',
      },
    },
  },
})

/**
 * The drop indicator `Compositor` renders. Its geometry must stay out of inline styles: the
 * `.pt-drop-indicator` rules of `editableWrapper` override it by specificity.
 */
export const dropIndicator = css({
  position: 'absolute',
  width: '100%',
  height: '1px',
  borderBottom: '1px solid currentColor',
  zIndex: 5,
})
