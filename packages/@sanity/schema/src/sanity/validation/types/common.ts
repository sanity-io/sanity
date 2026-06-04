import {isUnionDeclaration} from '../utils/union'
import {validateNonObjectFieldsProp} from '../utils/validateNonObjectFieldsProp'
import {validateTypeName} from '../utils/validateTypeName'
import {validateDeprecatedProperties} from './deprecated'

export default (typeDef: any, visitorContext: any) => {
  const skipTypeNameValidation = isUnionDeclaration(typeDef, visitorContext)

  return {
    ...typeDef,
    _problems: [
      ...(skipTypeNameValidation ? [] : validateTypeName(typeDef.type, visitorContext)),
      ...validateNonObjectFieldsProp(typeDef, visitorContext),
      ...validateDeprecatedProperties(typeDef),
    ].filter(Boolean),
  }
}
