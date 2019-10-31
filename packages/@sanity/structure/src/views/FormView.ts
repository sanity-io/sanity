import {View, ViewBuilder} from './View'
import {SerializeOptions} from '../StructureNodes'

export interface FormView extends View {}

export class FormViewBuilder extends ViewBuilder {
  protected spec: Partial<FormView>

  constructor(spec?: Partial<FormView>) {
    super(spec)
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  serialize(options: SerializeOptions = {path: []}): FormView {
    const base = super.serialize(options)
    return {
      ...base,
      type: 'form'
    }
  }

  clone(withSpec?: Partial<FormView>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
