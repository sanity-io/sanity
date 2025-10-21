import {DiffFromTo} from '../../../diff/components/DiffFromTo'
import {type DiffComponent, type StringDiff} from '../../../types'
import {DatetimePreview} from '../preview/DatetimePreview'

export const DatetimeFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return (
    <DiffFromTo
      align="center"
      diff={diff}
      layout="grid"
      previewComponent={DatetimePreview}
      schemaType={schemaType}
    />
  )
}
