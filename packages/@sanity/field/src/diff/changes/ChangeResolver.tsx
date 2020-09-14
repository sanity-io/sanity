import * as React from 'react'
import {ChangeNode} from '../../types'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

export function ChangeResolver({change, isGrouped}: {change: ChangeNode; isGrouped?: boolean}) {
  if (change.type === 'field') {
    return <FieldChange change={change} isGrouped={isGrouped} />
  }

  if (change.type === 'group') {
    return <GroupChange change={change} />
  }

  return <div>Unknown change type: {(change as any).type}</div>
}
