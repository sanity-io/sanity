import {type PresentationPluginOptions} from '../types'

export interface PresentationDocumentContextValue {
  options: PresentationPluginOptions[]
  register: (options: PresentationPluginOptions) => () => void
}
