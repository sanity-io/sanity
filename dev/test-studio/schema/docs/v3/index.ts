import {validationTest} from './async-functions/schemaType'
import {example1SchemaType} from './example1'
import {formComponentsSchema, formInputTest} from './form-components-api'

export const v3docs = {
  types: [example1SchemaType, validationTest, formComponentsSchema, formInputTest],
}
