import {ArrayDiff} from '@sanity/diff'
import {Annotation} from '../../panes/documentPane/history/types'

export interface ArrayDiffProps {
  diff: ArrayDiff<Annotation>
  items?: {fromType?: string; toType?: string}[]
  schemaType: any
}
