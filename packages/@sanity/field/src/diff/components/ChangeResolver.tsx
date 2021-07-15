import * as React from 'react'
import {ChangeNode} from '../../types'
import {FieldChange} from './FieldChange'
import {GroupChange} from './GroupChange'

export function ChangeResolver({
  change,
  ...restProps
}: {change: ChangeNode; readOnly?: boolean} & React.HTMLAttributes<HTMLDivElement>) {
  if (change.type === 'field') {
    return <FieldChange change={change} {...restProps} />
  }

  if (change.type === 'group') {
    return <GroupChange change={change} {...restProps} />
  }

  return <div>Unknown change type: {(change as any).type}</div>
}
