import React from 'react'
import {Diff, NoDiff} from '@sanity/diff'
import {FieldDiff} from '../../components/diffs/FieldDiff'
import {Annotation} from './history/types'
import {SchemaType} from './types'

type Props = {
  diff: Diff<Annotation> | NoDiff | null
  schemaType: SchemaType
}

export default function ChangeSummary({diff, schemaType}: Props) {
  console.log(diff)
  const blah = diff as any
  return <FieldDiff {...blah} schemaType={schemaType} />
}
