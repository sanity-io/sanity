import {DiffFromTo, DiffString} from '../../../diff'
import {type DiffComponent, type StringDiff} from '../../../types'
import {StringPreview} from '../preview/StringPreview'
import {stringWrapper} from './StringFieldDiff.css'

export const StringFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  const {options} = schemaType

  if (options?.list) {
    // When the string is considered to be an "enum", don't show individual
    // string segment changes, rather treat is as a "from -> to" diff
    return <DiffFromTo diff={diff} previewComponent={StringPreview} schemaType={schemaType} />
  }

  return (
    <div className={stringWrapper}>
      <DiffString diff={diff} />
    </div>
  )
}
