import {type I18nTextRecord, type ObjectField} from '@sanity/types'
import {type ComponentType} from 'react'

/**
 * @hidden
 * @beta */
export interface FormFieldGroup {
  name: string
  selected?: boolean
  disabled?: boolean
  title?: string
  i18n?: I18nTextRecord<'title'>
  icon?: ComponentType
  fields: ObjectField[]
}
