import {type Serializable} from '@sanity/presentation-comlink'

export interface PresentationSharedStateContextValue {
  removeValue: (key: string) => void
  setValue: (key: string, value: Serializable) => void
}
