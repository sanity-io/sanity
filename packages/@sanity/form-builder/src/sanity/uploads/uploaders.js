// @flow
import uploadImage from './uploadImage'
import uploadFile from './uploadFile'
import type {Uploader, UploaderDef} from './typedefs'
import type {Type} from '../../typedefs'
import {set} from '../../utils/patches'

const UPLOAD_IMAGE: UploaderDef = {
  type: 'image',
  accepts: 'image/*',
  upload: (file: File, type?: Type) => uploadImage(file)
}

const UPLOAD_FILE: UploaderDef = {
  type: 'file',
  accepts: '',
  upload: (file: File, type: Type) => uploadFile(file)
}

const UPLOAD_TEXT: UploaderDef = {
  type: 'string',
  accepts: 'text/*',
  upload: (file: File, type: Type) => uploadFile(file)
    .map(content => ({
      patches: [set(content)]
    }))
}

// Todo: promote this to a "first-class" form-builder abstraction
// and make it possible to register custom uploaders
const uploaders: Array<Uploader> = [
  UPLOAD_IMAGE,
  UPLOAD_TEXT,
  UPLOAD_FILE
].map((uploader, i) => ({
  ...uploader,
  priority: i
}))

export default uploaders
