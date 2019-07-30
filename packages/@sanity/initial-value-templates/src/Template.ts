export interface Template {
  id: string
  title: string
  schemaType: string
  icon?: Function
  value: {[key: string]: any}
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

  getTitle() {
    return this.spec.title
  }

  schemaType(typeName: string) {
    return this.clone({schemaType: typeName})
  }

  getSchemaType() {
    return this.spec.schemaType
  }

  icon(icon: Function) {
    return this.clone({icon})
  }

  getIcon() {
    return this.spec.icon
  }

  value(value: {[key: string]: any}) {
    return this.clone({value})
  }

  getValue() {
    return this.spec.value
  }

  serialize(): Template {
    const {id, title, schemaType, value, icon} = this.spec
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

    return {id, title, schemaType, value, icon}
  }

  clone(withSpec?: Partial<Template>) {
    const builder = new TemplateBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
