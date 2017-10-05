// @flow
import type {Patch} from '../../utils/patches'
import type {Type} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'

export type UploadEvent = {
  patches: ?Array<Patch>
}

export type UploaderDef = {
  type: string,
  accepts: string,
  upload: (file: File, type: Type) => ObservableI<UploadEvent>
}

export type Uploader = UploaderDef & {
  priority: number,
}
