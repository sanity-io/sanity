import {validateNonObjectFieldsProp} from '../utils/validateNonObjectFieldsProp'
import {validateTypeName} from '../utils/validateTypeName'

export default (typeDef, visitorContext) => {
  return {
    ...typeDef,
    _problems: [
      ...validateTypeName(typeDef.type, visitorContext),
      ...validateNonObjectFieldsProp(typeDef, visitorContext),
    ].filter(Boolean),
  }
}
