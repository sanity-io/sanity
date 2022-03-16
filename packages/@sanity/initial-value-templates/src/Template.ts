import {InitialValueProperty, SchemaType} from '@sanity/types'
import {TemplateParameter} from './TemplateParameters'

export interface Template<Params = any, Value = any> {
  id: string
  title: string
  description?: string
  schemaType: string
  icon?: SchemaType['icon']
  value: InitialValueProperty<Params, Value>
  parameters?: TemplateParameter[]
}

export class TemplateBuilder<Params = any, Value = any> {
  spec: Partial<Template<Params, Value>>

  constructor(spec?: Template<Params, Value>) {
    this.spec = spec || {}
  }

  id(id: string): TemplateBuilder<Params, Value> {
    return this.clone({id})
  }

  getId(): string | undefined {
    return this.spec.id
  }

  title(title: string): TemplateBuilder<Params, Value> {
    return this.clone({title})
  }

  description(description: string): TemplateBuilder<Params, Value> {
    return this.clone({description})
  }

  getDescription(): string | undefined {
    return this.spec.description
  }

  getTitle(): string | undefined {
    return this.spec.title
  }

  schemaType(typeName: string): TemplateBuilder<Params, Value> {
    return this.clone({schemaType: typeName})
  }

  getSchemaType(): string | undefined {
    return this.spec.schemaType
  }

  icon(icon: SchemaType['icon']): TemplateBuilder<Params, Value> {
    return this.clone({icon})
  }

  getIcon(): React.ComponentType<any> | undefined {
    return this.spec.icon
  }

  value(value: InitialValueProperty<Params, Value>): TemplateBuilder<Params, Value> {
    return this.clone({value})
  }

  getValue(): InitialValueProperty<Params, Value> {
    return this.spec.value
  }

  parameters(parameters: TemplateParameter[]): TemplateBuilder<Params, Value> {
    return this.clone({parameters})
  }

  getParameters(): TemplateParameter[] | undefined {
    return this.spec.parameters
  }

  serialize(): Template<Params, Value> {
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

  clone(withSpec?: Partial<Template<Params, Value>>): TemplateBuilder<Params, Value> {
    const builder = new TemplateBuilder<Params, Value>()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
