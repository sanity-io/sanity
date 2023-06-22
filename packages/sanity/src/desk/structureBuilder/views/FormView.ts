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
  /** Document list options */
  protected spec: Partial<FormView>

  constructor(spec?: Partial<FormView>) {
    super()
    this.spec = {id: 'editor', title: 'Editor', ...(spec ? spec : {})}
  }

  /**
   * Serialize Form view builder
   * @param options - Serialize options
   * @returns form view builder based on path provided in options
   */
  serialize(options: SerializeOptions = {path: []}): FormView {
    return {
      ...super.serialize(options),
      type: 'form',
    }
  }

  /**
   * Clone Form view builder (allows for options overriding)
   * @param withSpec - Form view builder options
   * @returns form view builder
   */
  clone(withSpec?: Partial<FormView>): FormViewBuilder {
    const builder = new FormViewBuilder()
    builder.spec = {...this.spec, ...(withSpec || {})}
    return builder
  }
}
