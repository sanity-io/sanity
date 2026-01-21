import {DiffFromTo} from '../../../diff/components/DiffFromTo'
import {type DiffComponent, type ObjectDiff} from '../../../types'
import {SlugPreview} from '../preview/SlugPreview'

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
