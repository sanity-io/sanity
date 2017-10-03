// @flow
import type {Patch} from '../../utils/patches'
import type {Type} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'

type EventType = 'process' | 'complete'

export type UploadEvent = {
  type: EventType,
  percent: number,
  patches: ?Array<Patch>
}

export type Uploader = {
  type: string,
  accepts: string,
  upload: (file: File, type: Type) => ObservableI<UploadEvent>
}
