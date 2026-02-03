import {isValidElement} from 'react'
import {isValidElementType} from 'react-is'

import {type DecorationMember} from '../../store/types/members'

export function MemberDecoration({member}: {member: DecorationMember}) {
  if (isValidElement(member.component)) {
    return member.component
  }

  if (isValidElementType(member.component)) {
    const Component = member.component
    return <Component key={member.key} />
  }
  console.error(
    'Invalid decoration member, expected a valid react component but received:',
    typeof member.component,
    member.component,
  )
  return null
}
