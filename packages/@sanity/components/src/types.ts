import {Path} from '@sanity/types'
import {Placement} from '@popperjs/core'

// Re-export Popper.js's `Placement` type
export {Placement}

// @todo: remove when @sanity/types has implemented this
export interface Marker {
  path: Path
  type: string
  level?: string
  item: {message: string}
}

export * from './autocomplete/types'
export * from './buttons/types'
export * from './dialogs/types'
export * from './menus/types'
export * from './previews/types'
export * from './snackbar/types'
