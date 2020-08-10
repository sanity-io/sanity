import {ArrayDiff} from '@sanity/diff'
import React from 'react'
import {Annotation} from '../../panes/documentPane/history/types'

export interface PTDiffProps {
  diff: ArrayDiff<Annotation>
  items?: {fromType?: {name: string}; toType?: {name: string}}[]
  schemaType: {name: string}
}

export function PTDiff(props: PTDiffProps) {
  return <div>Portable Text Diff</div>
}
