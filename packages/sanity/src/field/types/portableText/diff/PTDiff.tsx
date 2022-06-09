import React, {useMemo} from 'react'
import {DiffComponent, ObjectDiff} from '../../../types'
import PortableText from './components/PortableText'
import {createPortableTextDiff} from './helpers'

export const PTDiff: DiffComponent<ObjectDiff> = (props) => {
  const {diff, schemaType} = props

  const ptDiff = useMemo(() => createPortableTextDiff(diff, schemaType), [diff, schemaType])

  return (
    <div data-diff-action={diff.action}>
      <PortableText diff={ptDiff} schemaType={schemaType} />
    </div>
  )
}
