import {ChangeList} from '../../../diff'
import {type DiffComponent, type ObjectDiff} from '../../../types'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
