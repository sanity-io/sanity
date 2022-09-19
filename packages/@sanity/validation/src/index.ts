import RuleClass from './Rule'
import validateDocument from './validateDocument'
import inferFromSchema from './inferFromSchema'
import inferFromSchemaType from './inferFromSchemaType'

export default {Rule: RuleClass, validateDocument, inferFromSchema, inferFromSchemaType}
export {RuleClass as Rule, validateDocument, inferFromSchema, inferFromSchemaType}

export {validateDocumentObservable} from './validateDocument'
