import {type ObjectDiff} from 'sanity/_singleton'

import {ChangeList} from '../../../diff'
import {type DiffComponent} from '../../../types'

export const ObjectFieldDiff: DiffComponent<ObjectDiff> = ({diff, schemaType}) => {
  return <ChangeList diff={diff} schemaType={schemaType} />
}
