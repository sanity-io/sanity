import {DiffFromTo} from '../../../diff'
import {type DiffComponent, type ObjectDiff} from '../../../types'
import {SlugPreview} from '../preview'

interface Slug {
  current?: string
}

export const SlugFieldDiff: DiffComponent<ObjectDiff<Slug>> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      layout="inline"
      diff={diff}
      schemaType={schemaType}
      previewComponent={SlugPreview}
    />
  )
}
