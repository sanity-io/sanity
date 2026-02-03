import {type DiffComponent, type ObjectDiff} from '../../../types'
import {PortableText} from './components/PortableText'
import {createPortableTextDiff} from './helpers'
import {useMemo} from 'react'

export const PTDiff: DiffComponent<ObjectDiff> = (props) => {
  const {diff, schemaType} = props

  const ptDiff = useMemo(() => createPortableTextDiff(diff, schemaType), [diff, schemaType])

  return (
    <div data-diff-action={diff.action}>
      <PortableText diff={ptDiff} schemaType={schemaType} />
    </div>
  )
}
