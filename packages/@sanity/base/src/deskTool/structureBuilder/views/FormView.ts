import {SerializeOptions} from '../StructureNodes'
import {View, GenericViewBuilder} from './View'

export type FormView = View

export class FormViewBuilder extends GenericViewBuilder<Partial<View>, FormViewBuilder> {
  protected spec: Partial<FormView>

  constructor(spec?: Partial<FormView>) {
    super()
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  serialize(options: SerializeOptions = {path: []}): FormView {
    const base = super.serialize(options)
    const formView: FormView = {
      ...base,
      type: 'form',
    }
    return formView
  }

  clone(withSpec?: Partial<FormView>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
