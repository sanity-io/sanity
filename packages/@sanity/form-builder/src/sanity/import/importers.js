// @flow
import importImage from './importImage'
import {set} from '../../utils/patches'
import type {ObservableI} from './types/observable'
import Observable from '@sanity/observable'
import type {ImportEvent} from './types/import'
import type {Type} from '../../inputs/Array/types'
import importFile from './importFile'

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

type Importer = {
  type: string,
  accepts: string,
  import: (file: File, type: Type) => ObservableI<ImportEvent>
}

const IMPORT_IMAGE: Importer = {
  type: 'image',
  accepts: 'image/*',
  import: (file: File, type: any) => importImage(file)
}

const IMPORT_FILE: Importer = {
  type: 'file',
  accepts: '',
  import: (file: File, type: any) => importFile(file)
}

const IMPORT_TEXT: Importer = {
  type: 'string',
  accepts: 'text/*',
  import: (file: File, type: any) => readAsText(file)
    .map(content => ({
      patches: [set(content)]
    }))
}

// Todo: make it possible to register custom importers
const importers: Array<Importer> = [
  IMPORT_IMAGE,
  IMPORT_TEXT,
  IMPORT_FILE
].map((importer, i) => ({
  ...importer,
  priority: i
}))

export default importers
