import {DiffComponent} from './types'
import {DocumentDiff} from './DocumentDiff'
/*
import {ImageFieldDiff} from './ImageFieldDiff'
import {ObjectFieldDiff} from './ObjectFieldDiff'
import {ReferenceFieldDiff} from './ReferenceFieldDiff'
import {SlugFieldDiff} from './SlugFieldDiff'
*/
import {StringFieldDiff} from './StringFieldDiff'

export const defaultComponents: {[key: string]: DiffComponent<any>} = {
  string: StringFieldDiff,
  document: DocumentDiff
  /*
  object: ObjectFieldDiff,
  reference: ReferenceFieldDiff,
  image: ImageFieldDiff,
  slug: SlugFieldDiff
  */
}
