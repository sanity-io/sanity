import {DiffFromTo} from '../../../diff/components/DiffFromTo'
import {type DiffComponent, type NumberDiff} from '../../../types'
import {NumberPreview} from '../preview/NumberPreview'

export const NumberFieldDiff: DiffComponent<NumberDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={NumberPreview}
      layout="inline"
    />
  )
}
