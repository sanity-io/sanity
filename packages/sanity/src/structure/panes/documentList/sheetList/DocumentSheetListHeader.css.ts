import {createVar, globalStyle, style} from '@vanilla-extract/css'

export const widthVar = createVar()

export const header = style({
  margin: '16px',
  zIndex: 1,
  padding: '22px 0px',
  borderTop: '1px solid var(--card-border-color)',
  backgroundColor: 'var(--card-badge-default-bg-color)',
  boxSizing: 'border-box',
  textAlign: 'left',
  width: widthVar,
  maxWidth: widthVar,
})

export const pinnedHeader = style([header, {
  position: 'sticky',
  zIndex: 2,
}])

export const hoverMenu = style({
  visibility: 'hidden',
})

globalStyle(`${header}:hover ${hoverMenu}, ${pinnedHeader}:hover ${hoverMenu}`, {
  visibility: 'visible',
})
