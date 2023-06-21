import {SerializeOptions} from '../StructureNodes'
import {BaseView, GenericViewBuilder} from './View'

/**
 * Interface for form views.
 *
 * @public */
export interface FormView extends BaseView {
  type: 'form'
}

/**
 * Class for building a form view.
 *
 * @public */
export class FormViewBuilder extends GenericViewBuilder<Partial<BaseView>, FormViewBuilder> {
  protected spec: Partial<FormView>

  constructor(spec?: Partial<FormView>) {
    super()
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  serialize(options: SerializeOptions = {path: []}): FormView {
    return {
      ...super.serialize(options),
      type: 'form',
    }
  }

  clone(withSpec?: Partial<FormView>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
