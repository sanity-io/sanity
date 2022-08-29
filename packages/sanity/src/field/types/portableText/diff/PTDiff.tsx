import {ObjectSchemaType} from '@sanity/types'
import React, {useMemo} from 'react'
import {DiffComponent, ObjectDiff} from '../../../types'
import PortableText from './components/PortableText'
import {createPortableTextDiff} from './helpers'

export interface PortableTextFieldDiffProps {
  diff: ObjectDiff<Record<string, any>>
  schemaType: ObjectSchemaType
}

export const PortableTextFieldDiff: DiffComponent<ObjectDiff> = (
  props: PortableTextFieldDiffProps
) => {
  const {diff, schemaType} = props

  const ptDiff = useMemo(() => createPortableTextDiff(diff, schemaType), [diff, schemaType])

  return (
    <div data-diff-action={diff.action}>
      <PortableText diff={ptDiff} schemaType={schemaType} />
    </div>
  )
}
