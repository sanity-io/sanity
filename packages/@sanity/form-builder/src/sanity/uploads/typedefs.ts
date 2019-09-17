import {Type} from '../../typedefs'
import {Patch} from '../../typedefs/patch'
import {Observable} from 'rxjs'

export type UploadEvent = {
  type: 'uploadEvent'
  patches: Array<Patch> | null
}

export type ResolvedUploader = {uploader: Uploader; type: Type}

export type UploadOptions = {
  metadata?: Array<string> | null
  storeOriginalFilename?: boolean | null
}

export type UploaderDef = {
  type: string
  accepts: string
  upload: (file: File, type: Type) => Observable<UploadEvent>
}

export type Uploader = {
  type: string
  accepts: string
  upload: (file: File, type: Type, options?: UploadOptions) => Observable<UploadEvent>
  priority: number
}

export type UploaderResolver = (type: Type, file: File) => Uploader | null
