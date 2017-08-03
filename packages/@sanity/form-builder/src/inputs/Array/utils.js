// @flow

import accept from 'attr-accept'
import {Type} from './types'

// todo: extract and reuse
function is(typeName, type) {
  if (!type) {
    return false
  }
  return type.name === typeName || is(typeName, type.type)
}

export function getAcceptedMember(type : Type, file : File) {
  return type.of.find(memberType => {
    return (is('file', memberType) || is('image', memberType))
      && accept(file, (memberType.options || {}).accept)
  })
}
