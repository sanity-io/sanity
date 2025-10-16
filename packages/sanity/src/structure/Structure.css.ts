import {globalStyle, keyframes, style, styleVariants} from '@vanilla-extract/css'
import {vars} from '@sanity/ui/css'

// PaneDivider styles
export const paneDividerRootStyle = style({
  position: 'relative',
  width: '1px',
  minWidth: '1px',
  backgroundColor: 'transparent',
  selectors: {
    '&::before': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      bottom: 0,
      width: '1px',
      backgroundColor: vars.color.border,
    },
    '&:not([data-disabled])': {
      cursor: 'ew-resize',
      width: '9px',
      minWidth: '9px',
      margin: '0 -4px',
    },
    '&:not([data-disabled])::before': {
      left: '4px',
    },
    '&:not([data-disabled])::after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '9px',
      bottom: 0,
      backgroundColor: vars.color.border,
      opacity: 0,
      transition: 'opacity 150ms',
      zIndex: 100,
    },
    '&:not([data-disabled])[data-dragging]::after': {
      opacity: 0.2,
    },
    '&:not([data-disabled]):hover::after': {
      opacity: 0.2,
    },
  },
})

// LoadingPane styles
export const loadingPaneContentStyle = style({
  opacity: 0,
  transition: 'opacity 200ms',
  selectors: {
    '&[data-mounted]': {
      opacity: 1,
    },
  },
})

// StructureError styles
export const pathSegmentStyle = style({})

globalStyle(`${pathSegmentStyle}:not(:last-child)::after`, {
  content: '" ➝ "',
  opacity: 0.5,
})

// RevisionStatusLine styles
export const revisionStatusTextStyle = style({
  color: vars.color.muted.fg,
})

globalStyle(`${revisionStatusTextStyle} em`, {
  color: vars.color.fg,
  fontWeight: 500,
  fontStyle: 'normal',
})

// ListPaneContent styles
export const dividerContainerStyle = style({
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  margin: '0.75rem 0 0.25rem 0',
})

export const dividerHrStyle = style({
  flex: 1,
  backgroundColor: vars.color.border,
  height: '1px',
  margin: 0,
  border: 'none',
})

export const dividerTitleStyle = style({
  paddingBottom: '0.75rem',
  paddingLeft: '0.5rem',
  paddingRight: '0.5rem',
})

// UserComponentPaneContent styles
export const userComponentPaneRootStyle = style({
  position: 'relative',
})

// ConfirmDeleteDialog styles
export const dialogBodyStyle = style({
  boxSizing: 'border-box',
})

export const loadingContainerStyle = style({
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '110px',
})

// ConfirmDeleteDialogBody styles
export const chevronWrapperStyle = style({
  marginLeft: 'auto',
})

export const crossDatasetReferencesDetailsStyle = style({
  flex: 'none',
  selectors: {
    [`&[open] .${chevronWrapperStyle}`]: {
      transform: 'rotate(180deg)',
    },
  },
})

export const crossDatasetReferencesSummaryStyle = style({
  listStyle: 'none',
  selectors: {
    '&::-webkit-details-marker': {
      display: 'none',
    },
  },
})

export const tableStyle = style({
  width: '100%',
  textAlign: 'left',
  padding: `0 ${vars.space[2]}`,
  borderCollapse: 'collapse',
})

globalStyle(`${tableStyle} th`, {
  padding: vars.space[1],
})

globalStyle(`${tableStyle} td`, {
  padding: `0 ${vars.space[1]}`,
})

globalStyle(`${tableStyle} tr > *:last-child`, {
  textAlign: 'right',
})

export const documentIdFlexStyle = style({
  minHeight: '33px',
})

// PaneLayout styles
export const paneLayoutRootStyle = style({
  transition: 'opacity 200ms',
  position: 'relative',
  zIndex: 1,
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
  opacity: 0,
  selectors: {
    '&:not([hidden])': {
      display: 'flex',
    },
    '&:not([data-collapsed])': {
      overflow: 'auto',
    },
    '&[data-mounted]': {
      opacity: 1,
    },
    '&[data-resizing]': {
      pointerEvents: 'none',
    },
  },
})

// PaneHeader styles
export const paneHeaderRootStyle = style({
  lineHeight: 0,
  position: 'sticky',
  top: 0,
  selectors: {
    '&:not([data-collapsed])::after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: '-1px',
      opacity: 1,
    },
  },
})

// Style for when border is shown
export const paneHeaderRootBorderStyle = style({
  selectors: {
    '&:not([data-collapsed])::after': {
      borderBottom: `1px solid ${vars.color.border}`,
    },
  },
})

// Style for when border is hidden
export const paneHeaderRootNoBorderStyle = style({
  selectors: {
    '&:not([data-collapsed])::after': {
      borderBottom: '1px solid transparent',
    },
  },
})

export const paneHeaderLayoutStyle = style({
  transformOrigin: 'calc(51px / 2)',
})

globalStyle('[data-collapsed] > div > .paneHeaderLayoutStyle', {
  transform: 'rotate(90deg)',
})

export const paneHeaderTitleCardStyle = style({
  backgroundColor: vars.color.tinted.default.bg[0],
})

globalStyle(`${paneHeaderTitleCardStyle} [data-ui='Text']`, {
  color: vars.color.tinted.default.fg[0],
})

export const paneHeaderTitleTextSkeletonStyle = style({
  width: '66%',
  maxWidth: '175px',
})

export const paneHeaderTitleTextStyle = style({
  cursor: 'default',
  outline: 'none',
})

// Pane styles
export const paneRootStyle = style({
  outline: 'none',
  boxShadow: `1px 0 0 ${vars.color.border}`,
})

// PaneFooter styles
export const paneFooterRootStyle = style({
  position: 'sticky',
  bottom: 0,
})

export const paneFooterCardStyle = style({
  paddingBottom: 'env(safe-area-inset-bottom)',
})

// PaneContent styles
export const paneContentRootStyle = style({
  position: 'relative',
  outline: 'none',
})

// DocumentLayout styles
export const documentLayoutChangeConnectorStyle = style({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
})

// AnimatedStatusIcon styles
const rotateAnimation = keyframes({
  '0%': {
    transform: 'rotate(0)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
})

export const animatedStatusIconMotionPathStyle = style({
  transformOrigin: 'center',
})

export const animatedStatusIconRotateGroupStyle = style({
  transformOrigin: 'center',
  selectors: {
    '&[data-rotate]': {
      animationName: rotateAnimation,
      animationDuration: '1s',
      animationTimingFunction: 'ease-in-out',
      animationIterationCount: 'infinite',
    },
  },
})

// DocumentInspectorHeader styles
export const documentInspectorHeaderRootStyle = style({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,
})

// CanvasLinkedBanner styles
export const canvasLinkedBannerImageStyle = style({
  objectFit: 'cover',
  width: '100%',
  height: '180px',
  display: 'flex',
})

// InspectDialog styles
export const jsonInspectorWrapperStyle = style({})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector, ${jsonInspectorWrapperStyle} .json-inspector .json-inspector__selection`,
  {
    fontFamily: vars.font.code.family,
    fontSize: vars.font.code.scale[1].fontSize,
    lineHeight: vars.font.code.scale[1].lineHeight,
    color: vars.color.code.fg,
  },
)

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__leaf`, {
  paddingLeft: vars.space[4],
})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__leaf.json-inspector__leaf_root`,
  {
    paddingTop: vars.space[3],
    paddingLeft: 0,
  },
)

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key`,
  {
    display: 'none',
  },
)

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__line`, {
  display: 'block',
  position: 'relative',
  cursor: 'default',
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__line::after`, {
  content: '""',
  position: 'absolute',
  top: 0,
  left: '-200px',
  right: '-50px',
  bottom: 0,
  zIndex: -1,
  pointerEvents: 'none',
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__line:hover::after`, {
  background: vars.color.bg,
})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__leaf_composite > .json-inspector__line`,
  {
    cursor: 'pointer',
  },
)

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__leaf_composite > .json-inspector__line::before`,
  {
    content: '"▸ "',
    marginLeft: `calc(0px - ${vars.space[4]} + 3px)`,
    fontSize: vars.font.code.scale[1].fontSize,
    lineHeight: vars.font.code.scale[1].lineHeight,
  },
)

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__leaf_expanded.json-inspector__leaf_composite > .json-inspector__line::before`,
  {
    content: '"▾ "',
    fontSize: vars.font.code.scale[1].fontSize,
    lineHeight: vars.font.code.scale[1].lineHeight,
  },
)

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__radio, ${jsonInspectorWrapperStyle} .json-inspector .json-inspector__flatpath`,
  {
    display: 'none',
  },
)

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value`, {
  marginLeft: `calc(${vars.space[4]} / 2)`,
})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector > .json-inspector__leaf_root > .json-inspector__line > .json-inspector__key + .json-inspector__value`,
  {
    margin: 0,
  },
)

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__key`, {
  color: vars.color.code.token.property,
})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value_helper, ${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value_null`,
  {
    color: vars.color.code.token.constant,
  },
)

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__not-found`, {
  paddingTop: vars.space[3],
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value_string`, {
  color: vars.color.code.token.string,
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value_boolean`, {
  color: vars.color.code.token.boolean,
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__value_number`, {
  color: vars.color.code.token.number,
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__show-original`, {
  display: 'inline-block',
  padding: '0 6px',
  cursor: 'pointer',
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__show-original:hover`, {
  color: 'inherit',
})

globalStyle(`${jsonInspectorWrapperStyle} .json-inspector .json-inspector__show-original::before`, {
  content: '"↔"',
})

globalStyle(
  `${jsonInspectorWrapperStyle} .json-inspector .json-inspector__show-original:hover::after`,
  {
    content: '" expand"',
  },
)

// Changes inspectors styles
export const changesInspectorFadeInFlexStyle = style({
  opacity: 0,
  transition: 'opacity 200ms',
  selectors: {
    '&[data-ready]': {
      opacity: 1,
    },
  },
})

export const changesInspectorScrollerStyle = style({
  height: '100%',
  overflow: 'auto',
  position: 'relative',
  scrollBehavior: 'smooth',
})

export const changesInspectorGridStyle = style({
  gridTemplateColumns: '48px 1fr',
  alignItems: 'center',
  gap: '0.25em',
  selectors: {
    '&:not([hidden])': {
      display: 'grid',
    },
  },
})

export const eventsInspectorSpinnerContainerStyle = style({
  width: '100%',
  position: 'absolute',
  bottom: '-4px',
})

// Timeline styles
export const timelineMenuRootStyle = style({
  overflow: 'hidden',
})

const timelineItemIconBoxBase = style({
  position: 'absolute',
  width: vars.avatar.scale[0].size,
  height: vars.avatar.scale[0].size,
  right: '-3px',
  bottom: '-3px',
  borderRadius: '50%',
  boxShadow: `0 0 0 1px ${vars.color.bg}`,
})

export const timelineItemIconBoxStyle = styleVariants({
  blue: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.blue.bg}],
  gray: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.gray.bg}],
  green: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.green.bg}],
  yellow: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.yellow.bg}],
  orange: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.orange.bg}],
  red: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.red.bg}],
  magenta: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.magenta.bg}],
  purple: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.purple.bg}],
  cyan: [timelineItemIconBoxBase, {backgroundColor: vars.color.avatar.cyan.bg}],
})

export const timelineItemNameSkeletonStyle = style({
  width: '6ch',
  height: vars.font.text.scale[0].lineHeight,
})

export const timelineStackWrapperStyle = style({
  maxWidth: '200px',
})

export const timelineRootStyle = style({
  opacity: 0,
  pointerEvents: 'none',
  transition: 'opacity 0.2s',
  selectors: {
    '&[data-visible]': {
      opacity: 1,
      pointerEvents: 'auto',
    },
  },
})

export const expandableTimelineFlipIconStyle = style({
  transition: 'transform 200ms',
  selectors: {
    '&[data-expanded="true"]': {
      transform: 'rotate(-90deg)',
    },
  },
})

// Document panel styles
export const documentViewsRootStyle = style({
  position: 'relative',
})

export const documentPanelHeaderScrollerStyle = style({
  scrollbarWidth: 'none',
  zIndex: 1,
  flex: 1,
  position: 'relative',
  selectors: {
    '> div::-webkit-scrollbar': {
      width: 0,
      height: 0,
    },
    '&[data-show-gradient]::after': {
      content: '""',
      display: 'block',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: '150px',
      background: `linear-gradient(to right, color-mix(in srgb, ${vars.color.bg} 0%, transparent), ${vars.color.bg})`,
      transition: 'opacity 300ms ease-out',
      pointerEvents: 'none',
    },
  },
})

// DiffView styles
export const diffViewScrollerStyle = style({
  position: 'relative',
  height: '100%',
  overflow: 'auto',
  scrollBehavior: 'smooth',
  scrollbarWidth: 'var(--scrollbar-width)',
  overscrollBehavior: 'contain',
  willChange: 'scroll-position',
})

export const diffViewDialogLayoutStyle = style({
  vars: {
    '--offset-block': '40px',
  },
  display: 'grid',
  height: 'calc(100vh - var(--offset-block))',
  minHeight: 0,
  overflow: 'hidden',
  gridTemplateAreas: '"header header" "previous-document next-document"',
  gridTemplateColumns: '1fr 1fr',
  gridTemplateRows: 'min-content minmax(0, 1fr)',
})

export const diffViewEditReferenceLinkStyle = style({
  flex: 1,
  textDecoration: 'none',
  color: 'inherit',
})
