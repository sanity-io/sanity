import {DiffFromTo} from '../../../diff'
import {type DiffComponent, type StringDiff} from '../../../types'
import {DatetimePreview} from '../preview'

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
