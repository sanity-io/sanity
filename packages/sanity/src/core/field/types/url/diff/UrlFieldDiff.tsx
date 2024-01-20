import {DiffFromTo} from '../../../diff'
import {type DiffComponent, type StringDiff} from '../../../types'
import {StringPreview} from '../../string/preview'

export const UrlFieldDiff: DiffComponent<StringDiff> = ({diff, schemaType}) => {
  return <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={StringPreview} />
}
