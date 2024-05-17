import {validateNonObjectFieldsProp} from '../utils/validateNonObjectFieldsProp'
import {validateTypeName} from '../utils/validateTypeName'
import {validateDeprecatedProperties} from './deprecated'

export default (typeDef: any, visitorContext: any) => {
  return {
    ...typeDef,
    _problems: [
      ...validateTypeName(typeDef.type, visitorContext),
      ...validateNonObjectFieldsProp(typeDef, visitorContext),
      ...validateDeprecatedProperties(typeDef),
    ].filter(Boolean),
  }
}
