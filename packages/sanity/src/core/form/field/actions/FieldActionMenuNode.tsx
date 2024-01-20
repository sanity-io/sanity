import {MenuDivider} from '@sanity/ui'

import {type DocumentFieldActionNode} from '../../../config'
import {FieldActionMenuGroup} from './FieldActionMenuGroup'
import {FieldActionMenuItem} from './FieldActionMenuItem'

interface FieldActionMenuNodeProps {
  action: DocumentFieldActionNode
  isFirst: boolean
  prevIsGroup: boolean
}

export function FieldActionMenuNode(props: FieldActionMenuNodeProps) {
  const {action, isFirst, prevIsGroup} = props

  if (action.type === 'divider') {
    return <MenuDivider />
  }

  if (action.type === 'group') {
    return (
      <>
        {!isFirst && <MenuDivider />}
        <FieldActionMenuGroup group={action} />
      </>
    )
  }

  return (
    <>
      {prevIsGroup && <MenuDivider />}
      <FieldActionMenuItem action={action} />
    </>
  )
}
