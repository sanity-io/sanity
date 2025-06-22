import {validationTest} from './async-functions/schemaType'
import {example1SchemaType} from './example1/schemaType'
import {formComponentsSchema} from './form-components-api/schema'
import {formInputTest} from './form-components-api/formInputTest'

export const v3docs = {
  types: [example1SchemaType, validationTest, formComponentsSchema, formInputTest],
}
