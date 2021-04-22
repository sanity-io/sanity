import {InitialValueProperty, SchemaType} from '@sanity/types'
import {TemplateParameter} from './TemplateParameters'

export interface Template {
  id: string
  title: string
  description?: string
  schemaType: string
  icon?: SchemaType['icon']
  value: InitialValueProperty
  parameters?: TemplateParameter[]
}

export class TemplateBuilder {
  spec: Partial<Template>

  constructor(spec?: Template) {
    this.spec = spec || {}
  }

  id(id: string) {
    return this.clone({id})
  }

  getId() {
    return this.spec.id
  }

  title(title: string) {
    return this.clone({title})
  }

  description(description: string) {
    return this.clone({description})
  }

  getDescription() {
    return this.spec.description
  }

  getTitle() {
    return this.spec.title
  }

  schemaType(typeName: string) {
    return this.clone({schemaType: typeName})
  }

  getSchemaType() {
    return this.spec.schemaType
  }

  icon(icon: SchemaType['icon']) {
    return this.clone({icon})
  }

  getIcon() {
    return this.spec.icon
  }

  value(value: InitialValueProperty) {
    return this.clone({value})
  }

  getValue() {
    return this.spec.value
  }

  parameters(parameters: TemplateParameter[]) {
    return this.clone({parameters})
  }

  getParameters() {
    return this.spec.parameters
  }

  serialize(): Template {
    const {id, title, description, schemaType, value, icon, parameters} = this.spec
    if (!id) {
      throw new Error('Template is missing required "id"')
    }

    if (!title) {
      throw new Error(`Template with ID "${id}" is missing required "title"`)
    }

    if (!schemaType) {
      throw new Error(`Template with ID "${id}" is missing required "schemaType"`)
    }

    if (!value) {
      throw new Error(`Template with ID "${id}" is missing required "value"`)
    }

    return {id, title, description, schemaType, value, icon, parameters}
  }

  clone(withSpec?: Partial<Template>) {
    const builder = new TemplateBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
