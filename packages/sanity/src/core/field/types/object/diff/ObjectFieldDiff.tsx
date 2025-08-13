import {ChangeList} from '../../../diff/components/ChangeList'
import {type DiffComponent, type ObjectDiff} from '../../../types'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
