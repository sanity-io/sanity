import {ContainerProps, DialogProps} from '@sanity/ui'

export const DIALOG_WIDTH_TO_UI_WIDTH: {[key: string]: DialogProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}

export const POPOVER_WIDTH_TO_UI_WIDTH: {[key: string]: ContainerProps['width']} = {
  small: 0,
  medium: 1,
  large: 2,
  full: 'auto',
}
