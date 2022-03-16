import {ObjectField, ObjectSchemaTypeWithOptions} from '@sanity/types'

export interface FormBuilderFilterFieldFn {
  (type: ObjectSchemaTypeWithOptions, field: ObjectField, selectedLanguageIds: string[]): boolean
}
