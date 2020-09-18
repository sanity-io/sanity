import * as React from 'react'
import {ChangeNode} from '../../types'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

export function ChangeResolver({change}: {change: ChangeNode}) {
  if (change.type === 'field') {
    return <FieldChange change={change} />
  }

  if (change.type === 'group') {
    return <GroupChange change={change} />
  }

  return <div>Unknown change type: {(change as any).type}</div>
}
