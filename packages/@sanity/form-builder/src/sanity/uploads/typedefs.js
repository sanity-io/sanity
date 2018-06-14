// @flow
import type {Patch} from '../../utils/patches'
import type {Type} from '../../typedefs'
import type {ObservableI} from '../../typedefs/observable'

export type UploadEvent = {
  patches: ?Array<Patch>
}

export type UploadOptions = {
  metadata: ?Array<String>
}

export type UploaderDef = {
  type: string,
  accepts: string,
  upload: (file: File, type: Type) => ObservableI<UploadEvent>
}

export type Uploader = {
  type: string,
  accepts: string,
  upload: (file: File, type: Type, options?: UploadOptions) => ObservableI<UploadEvent>,
  priority: number
}

export type UploaderResolver = (type: Type, file: File) => ?Uploader
