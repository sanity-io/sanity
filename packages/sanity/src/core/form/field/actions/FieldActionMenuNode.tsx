import {MenuDivider} from '@sanity/ui'
import React from 'react'
import {DocumentFieldActionNode} from '../../../config'
import {FieldActionMenuItem} from './FieldActionMenuItem'
import {FieldActionMenuGroup} from './FieldActionMenuGroup'

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
