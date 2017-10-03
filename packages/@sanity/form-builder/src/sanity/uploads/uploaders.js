// @flow
import uploadImage from './uploadImage'
import uploadFile from './uploadFile'
import Observable from '@sanity/observable'
import type {Uploader} from './typedefs'
import {set} from '../../utils/patches'

function readAsText(file: File) {
  return new Observable(observer => {
    const reader = new FileReader()
    reader.onerror = error => observer.error(error)
    reader.onload = () => {
      observer.next(reader.result)
      observer.complete()
    }
    reader.readAsText(file)
  })
}

const IMPORT_IMAGE: Uploader = {
  type: 'image',
  accepts: 'image/*',
  upload: (file: File, type: any) => uploadImage(file)
}

const IMPORT_FILE: Uploader = {
  type: 'file',
  accepts: '',
  upload: (file: File, type: any) => uploadFile(file)
}

const IMPORT_TEXT: Uploader = {
  type: 'string',
  accepts: 'text/*',
  upload: (file: File, type: any) => readAsText(file)
    .map(content => ({
      patches: [set(content)]
    }))
}

// Todo: make it possible to register custom importers
const importers: Array<Uploader> = [
  IMPORT_IMAGE,
  IMPORT_TEXT,
  IMPORT_FILE
].map((importer, i) => ({
  ...importer,
  priority: i
}))

export default importers
