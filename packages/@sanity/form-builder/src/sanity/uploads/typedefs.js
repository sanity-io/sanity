// @flow
import type {Patch} from '../../utils/patches'
import type {Type} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'

export type UploadEvent = {
  type: 'uploadEvent',
  patches: ?Array<Patch>
}

export type Uploader = {
  type: string,
  accepts: string,
  upload: (file: File, type: Type) => ObservableI<UploadEvent>
}
