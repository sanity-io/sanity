import {DiffFromTo} from '../../../diff'
import {type DiffComponent, type ReferenceDiff} from '../../../types'
import {ReferencePreview} from '../preview/ReferencePreview'

export const ReferenceFieldDiff: DiffComponent<ReferenceDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      align="center"
      diff={diff}
      layout="grid"
      path="_ref"
      previewComponent={ReferencePreview}
      schemaType={schemaType}
    />
  )
}
