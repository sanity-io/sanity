import {warning} from '../createValidationResult'
import {validateTypeName} from '../utils/validateTypeName'

export default (typeDef, visitorContext) => {
  return {
    ...typeDef,
    _problems: validateTypeName(typeDef.type, visitorContext).filter(Boolean),
  }
}
