import {example1SchemaType} from './example1'
import {validationTest} from './async-functions/schemaType'
import {formComponentsSchema} from './form-components-api'

export const v3docs = {
  types: [example1SchemaType, validationTest, formComponentsSchema],
}
