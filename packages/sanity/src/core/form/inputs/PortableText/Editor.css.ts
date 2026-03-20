import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const resizeVar = createVar()
export const heightVar = createVar()
export const counterResetVar = createVar()
export const firstChildPaddingTopVar = createVar()
export const paddingBottomVar = createVar()
export const maxWidthVar = createVar()
export const dropIndicatorRadiusVar = createVar()
export const dropIndicatorLeftVar = createVar()
export const dropIndicatorRightVar = createVar()
export const dropIndicatorWidthVar = createVar()
export const listSpaceVar = createVar()
export const listItemSpaceVar = createVar()

export const root = style({
  selectors: {
    "&&[data-fullscreen='true']": {
      height: '100%',
    },
    "&&[data-fullscreen='false']": {
      minHeight: '5em',
      resize: resizeVar,
      overflow: 'auto',
      height: heightVar,
    },
    '&&:not([hidden])': {
      display: 'flex',
    },
    '&&': {
      flexDirection: 'column',
    },
  },
})

export const toolbarCard = style({
  selectors: {
    '&&': {
      zIndex: 10,
      lineHeight: '0',
    },
  },
})

export const editableCard = style({
  selectors: {
    '&&': {
      position: 'relative',
      overflow: 'hidden',
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

globalStyle(`${editableCard}::selection, ${editableCard} *::selection`, {
  backgroundColor: 'transparent',
})

export const scroller = style({
  selectors: {
    '&&': {
      position: 'relative',
      overflow: 'auto',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
  },
})

globalStyle(`${scroller} > *`, {
  flex: 1,
  minHeight: 'auto',
})

export const editableWrapper = style({
  selectors: {
    '&&': {
      height: '100%',
      width: '100%',
      counterReset: counterResetVar,
      overflow: 'hidden',
    },
  },
})

globalStyle(`${editableWrapper} > div`, {
  height: '100%',
})

globalStyle(`${editableWrapper} .pt-editable`, {
  display: 'block',
  width: '100%',
  height: '100%',
  paddingBottom: paddingBottomVar,
})

globalStyle(`${editableWrapper} .pt-editable > :first-child`, {
  paddingTop: firstChildPaddingTopVar,
})

globalStyle(`${editableWrapper} .pt-editable > .pt-block`, {
  margin: '0 auto',
  maxWidth: maxWidthVar,
})

globalStyle(
  `${editableWrapper} .pt-editable > .pt-list-item-bullet + .pt-list-item-number, ${editableWrapper} .pt-editable > .pt-list-item-number + .pt-list-item-bullet`,
  {
    marginTop: listSpaceVar,
  },
)

globalStyle(`${editableWrapper} .pt-editable > :not(.pt-list-item) + .pt-list-item`, {
  marginTop: listItemSpaceVar,
})

globalStyle(`${editableWrapper} .pt-editable > .pt-list-item + :not(.pt-list-item)`, {
  marginTop: listSpaceVar,
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-1 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-2 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-2',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-3 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-3',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-4 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-4',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-5 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-5',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-6 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-6',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-7 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-7',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-8 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-8',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-9 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-9',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}'][data-list-index='1']`, {
  counterSet: 'list-level-10 1',
})

globalStyle(`${editableWrapper} .pt-editable [data-level='${l}']:not([data-list-index='1'])`, {
  counterIncrement: 'list-level-10',
})

globalStyle(`${editableWrapper} .pt-editable .pt-drop-indicator`, {
  pointerEvents: 'none',
  border: '1px solid var(--card-focus-ring-color) !important',
  height: '0px !important',
  borderRadius: dropIndicatorRadiusVar,
  marginTop: '-3px',
  left: dropIndicatorLeftVar,
  right: dropIndicatorRightVar,
  width: dropIndicatorWidthVar,
})
